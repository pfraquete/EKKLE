'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getProfile } from './auth';
import {
  createOrder,
  getOrder,
  createSplitRules,
  calculateSplitAmounts,
  PagarmeError,
} from '@/lib/pagarme';

// =====================================================
// TYPES
// =====================================================

export interface CoursePayment {
  id: string;
  course_id: string;
  profile_id: string;
  church_id: string;
  order_id: string | null;
  amount_cents: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'awaiting_confirmation' | 'expired';
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  expires_at?: string | null;
  confirmed_by?: string | null;
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const paymentInputSchema = z.object({
  course_id: z.string().uuid(),
  payment_method: z.enum(['credit_card', 'pix', 'cash']),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    document: z.string().min(11),
    phone: z.string().optional(),
  }),
  card: z.object({
    number: z.string(),
    holder_name: z.string(),
    exp_month: z.number(),
    exp_year: z.number(),
    cvv: z.string(),
  }).optional(),
});

type PaymentInput = z.infer<typeof paymentInputSchema>;

// =====================================================
// CREATE COURSE PAYMENT
// =====================================================

export async function createCoursePayment(input: PaymentInput) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const validated = paymentInputSchema.parse(input);
    const supabase = await createClient();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price_cents, is_paid, church_id')
      .eq('id', validated.course_id)
      .single();

    if (courseError || !course) {
      return { success: false, error: 'Curso não encontrado' };
    }

    if (!course.is_paid || !course.price_cents) {
      return { success: false, error: 'Este curso é gratuito' };
    }

    // Check if already paid or awaiting confirmation
    const { data: existingPayment } = await supabase
      .from('course_payments')
      .select('id, status')
      .eq('course_id', validated.course_id)
      .eq('profile_id', profile.id)
      .in('status', ['paid', 'awaiting_confirmation'])
      .single();

    if (existingPayment) {
      if (existingPayment.status === 'paid') {
        return { success: false, error: 'Você já pagou por este curso' };
      }
      if (existingPayment.status === 'awaiting_confirmation') {
        return { success: false, error: 'Você já tem um pagamento aguardando confirmação' };
      }
    }

    // Handle cash payment (payment at church)
    if (validated.payment_method === 'cash') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours to confirm

      const { data: payment, error: paymentError } = await supabase
        .from('course_payments')
        .insert({
          course_id: validated.course_id,
          profile_id: profile.id,
          church_id: course.church_id,
          amount_cents: course.price_cents,
          platform_fee_cents: 0, // No platform fee for cash
          church_amount_cents: course.price_cents, // 100% for church
          status: 'awaiting_confirmation',
          payment_method: 'cash',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error('Error saving cash payment:', paymentError);
        return { success: false, error: 'Erro ao registrar pagamento' };
      }

      revalidatePath(`/cursos/${validated.course_id}`);
      revalidatePath('/cursos');

      return {
        success: true,
        paid: false,
        payment_id: payment.id,
        payment_method: 'cash',
        expires_at: expiresAt.toISOString(),
        message: 'Inscrição registrada! Efetue o pagamento na igreja em até 72 horas para confirmar sua inscrição.'
      };
    }

    // Get recipient configuration for split (only for online payments)
    const { data: recipient } = await supabase
      .from('recipients')
      .select('*')
      .eq('church_id', course.church_id)
      .single();

    if (!recipient || recipient.status !== 'active') {
      return { success: false, error: 'Igreja não configurada para receber pagamentos' };
    }

    const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
    if (!platformRecipientId) {
      console.error('PAGARME_PLATFORM_RECIPIENT_ID not configured');
      return { success: false, error: 'Configuração de pagamento inválida' };
    }

    // Calculate split (1% platform, 99% church)
    const splitRules = createSplitRules(
      course.price_cents,
      recipient.pagarme_recipient_id,
      platformRecipientId
    );
    const { platformFeeCents, churchAmountCents } = calculateSplitAmounts(course.price_cents);

    // Clean document
    const cleanDocument = validated.customer.document.replace(/\D/g, '');
    const documentType = cleanDocument.length <= 11 ? 'cpf' : 'cnpj';
    const customerType = cleanDocument.length <= 11 ? 'individual' : 'company';

    // Prepare phones
    const phones: { mobile_phone?: { country_code: string; area_code: string; number: string } } = {};
    if (validated.customer.phone) {
      const cleanPhone = validated.customer.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        phones.mobile_phone = {
          country_code: '55',
          area_code: cleanPhone.substring(0, 2),
          number: cleanPhone.substring(2),
        };
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('course_payments')
      .insert({
        course_id: validated.course_id,
        profile_id: profile.id,
        church_id: course.church_id,
        amount_cents: course.price_cents,
        platform_fee_cents: platformFeeCents,
        church_amount_cents: churchAmountCents,
        status: 'pending',
        payment_method: validated.payment_method,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return { success: false, error: 'Erro ao criar registro de pagamento' };
    }

    // Create order in Pagar.me
    const orderPayload: any = {
      code: `course-${payment.id}`,
      items: [
        {
          amount: course.price_cents,
          description: `Curso: ${course.title}`,
          quantity: 1,
        },
      ],
      customer: {
        name: validated.customer.name,
        email: validated.customer.email,
        document: cleanDocument,
        document_type: documentType,
        type: customerType,
        phones,
      },
      payments: [
        {
          payment_method: validated.payment_method,
          split: splitRules,
        },
      ],
      metadata: {
        course_id: validated.course_id,
        profile_id: profile.id,
        church_id: course.church_id,
        payment_id: payment.id,
        type: 'course_payment',
      },
    };

    // Add payment method specific data
    if (validated.payment_method === 'credit_card' && validated.card) {
      orderPayload.payments[0].credit_card = {
        card: {
          number: validated.card.number.replace(/\s/g, ''),
          holder_name: validated.card.holder_name,
          exp_month: validated.card.exp_month,
          exp_year: validated.card.exp_year,
          cvv: validated.card.cvv,
        },
        installments: 1,
        statement_descriptor: 'EKKLE CURSO',
      };
    } else if (validated.payment_method === 'pix') {
      orderPayload.payments[0].pix = {
        expires_in: 3600, // 1 hour
        additional_information: [
          { name: 'Curso', value: course.title },
        ],
      };
    }

    const order = await createOrder(orderPayload);

    // Update payment with order ID
    await supabase
      .from('course_payments')
      .update({ order_id: order.id })
      .eq('id', payment.id);

    // Check if paid immediately (credit card)
    const charge = order.charges?.[0];
    const isPaid = charge?.status === 'paid';

    if (isPaid) {
      await supabase
        .from('course_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      // Enroll user in course
      await supabase.from('course_enrollments').insert({
        course_id: validated.course_id,
        profile_id: profile.id,
        church_id: course.church_id,
        enrolled_at: new Date().toISOString(),
        status: 'ACTIVE',
      });

      revalidatePath(`/cursos/${validated.course_id}`);
      revalidatePath('/cursos');

      return {
        success: true,
        paid: true,
        payment_id: payment.id,
      };
    }

    // For PIX, return QR code
    if (validated.payment_method === 'pix') {
      const pixTransaction = charge?.last_transaction;
      return {
        success: true,
        paid: false,
        payment_id: payment.id,
        order_id: order.id,
        pix_qr_code: pixTransaction?.qr_code,
        pix_qr_code_url: pixTransaction?.qr_code_url,
        pix_expires_at: pixTransaction?.expires_at,
      };
    }

    return {
      success: true,
      paid: false,
      payment_id: payment.id,
    };
  } catch (error) {
    console.error('Error creating course payment:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof PagarmeError) {
      const errorMessage = error.data?.errors?.[0]?.message || error.data?.message || 'Erro no gateway de pagamento';
      return { success: false, error: errorMessage };
    }

    return { success: false, error: 'Erro ao processar pagamento' };
  }
}

// =====================================================
// CHECK COURSE PAYMENT STATUS
// =====================================================

export async function checkCoursePaymentStatus(orderId: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const order = await getOrder(orderId);
    const charge = order.charges?.[0];
    const isPaid = charge?.status === 'paid';

    if (isPaid) {
      const supabase = await createClient();

      // Update payment status
      const { data: payment } = await supabase
        .from('course_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .select()
        .single();

      if (payment) {
        // Enroll user in course
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', payment.course_id)
          .eq('profile_id', payment.profile_id)
          .single();

        if (!existingEnrollment) {
          await supabase.from('course_enrollments').insert({
            course_id: payment.course_id,
            profile_id: payment.profile_id,
            church_id: payment.church_id,
            enrolled_at: new Date().toISOString(),
            status: 'ACTIVE',
          });
        }

        revalidatePath(`/cursos/${payment.course_id}`);
        revalidatePath('/cursos');
      }
    }

    return {
      success: true,
      status: charge?.status || order.status,
      paid: isPaid,
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return { success: false, error: 'Erro ao verificar pagamento' };
  }
}

// =====================================================
// GET COURSE PAYMENT
// =====================================================

export async function getCoursePayment(courseId: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('course_payments')
      .select('*')
      .eq('course_id', courseId)
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as CoursePayment;
  } catch (error) {
    console.error('Error getting course payment:', error);
    return null;
  }
}

// =====================================================
// CHECK IF USER HAS PAID FOR COURSE
// =====================================================

export async function hasUserPaidForCourse(courseId: string): Promise<boolean> {
  try {
    const profile = await getProfile();
    if (!profile) {
      return false;
    }

    const supabase = await createClient();

    const { data } = await supabase
      .from('course_payments')
      .select('id')
      .eq('course_id', courseId)
      .eq('profile_id', profile.id)
      .eq('status', 'paid')
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}


// =====================================================
// CONFIRM CASH PAYMENT (Admin/Pastor only)
// =====================================================

export async function confirmCourseCashPayment(paymentId: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Check if user is admin/pastor
    if (!['pastor', 'pastora', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para confirmar pagamentos' };
    }

    const supabase = await createClient();

    // Get payment
    const { data: payment } = await supabase
      .from('course_payments')
      .select('*, course:courses(id, title)')
      .eq('id', paymentId)
      .eq('church_id', profile.church_id)
      .eq('status', 'awaiting_confirmation')
      .single();

    if (!payment) {
      return { success: false, error: 'Pagamento não encontrado ou já processado' };
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('course_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        confirmed_by: profile.id
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error confirming payment:', updateError);
      return { success: false, error: 'Erro ao confirmar pagamento' };
    }

    // Enroll user in course
    await supabase.from('course_enrollments').insert({
      course_id: payment.course_id,
      profile_id: payment.profile_id,
      church_id: payment.church_id,
      enrolled_at: new Date().toISOString(),
      status: 'ACTIVE',
    });

    revalidatePath('/dashboard/financeiro');
    revalidatePath(`/cursos/${payment.course_id}`);
    revalidatePath('/cursos');

    return { success: true, message: 'Pagamento confirmado com sucesso!' };
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    return { success: false, error: 'Erro ao confirmar pagamento' };
  }
}

// =====================================================
// REJECT CASH PAYMENT (Admin/Pastor only)
// =====================================================

export async function rejectCourseCashPayment(paymentId: string, reason?: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Check if user is admin/pastor
    if (!['pastor', 'pastora', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para rejeitar pagamentos' };
    }

    const supabase = await createClient();

    // Get payment
    const { data: payment } = await supabase
      .from('course_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('church_id', profile.church_id)
      .eq('status', 'awaiting_confirmation')
      .single();

    if (!payment) {
      return { success: false, error: 'Pagamento não encontrado ou já processado' };
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('course_payments')
      .update({
        status: 'cancelled',
        rejection_reason: reason
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error rejecting payment:', updateError);
      return { success: false, error: 'Erro ao rejeitar pagamento' };
    }

    revalidatePath('/dashboard/financeiro');
    revalidatePath(`/cursos/${payment.course_id}`);
    revalidatePath('/cursos');

    return { success: true, message: 'Pagamento rejeitado' };
  } catch (error) {
    console.error('Error rejecting cash payment:', error);
    return { success: false, error: 'Erro ao rejeitar pagamento' };
  }
}

// =====================================================
// GET PENDING CASH PAYMENTS (Admin/Pastor only)
// =====================================================

export async function getPendingCourseCashPayments() {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Usuário não autenticado', payments: [] };
    }

    // Check if user is admin/pastor
    if (!['pastor', 'pastora', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão', payments: [] };
    }

    const supabase = await createClient();

    const { data: payments, error } = await supabase
      .from('course_payments')
      .select(`
        *,
        course:courses(id, title),
        user:profiles!course_payments_profile_id_fkey(id, full_name, email, phone)
      `)
      .eq('church_id', profile.church_id)
      .eq('status', 'awaiting_confirmation')
      .eq('payment_method', 'cash')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending payments:', error);
      return { success: false, error: 'Erro ao buscar pagamentos', payments: [] };
    }

    return { success: true, payments };
  } catch (error) {
    console.error('Error getting pending cash payments:', error);
    return { success: false, error: 'Erro ao buscar pagamentos', payments: [] };
  }
}

// =====================================================
// CANCEL EXPIRED CASH PAYMENTS (Cron job)
// =====================================================

export async function cancelExpiredCourseCashPayments() {
  const supabase = await createClient();
  
  // Find expired payments (older than 72 hours)
  const { data: expiredPayments, error } = await supabase
    .from('course_payments')
    .select('id, course_id, profile_id')
    .eq('status', 'awaiting_confirmation')
    .eq('payment_method', 'cash')
    .lt('expires_at', new Date().toISOString());

  if (error || !expiredPayments?.length) {
    return { cancelled: 0 };
  }

  // Cancel each expired payment
  for (const payment of expiredPayments) {
    await supabase
      .from('course_payments')
      .update({ status: 'expired' })
      .eq('id', payment.id);
  }

  return { cancelled: expiredPayments.length };
}
