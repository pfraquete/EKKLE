'use server';

import { createClient } from '@/lib/supabase/server';
import { createOrder, getOrder, createSplitRules } from '@/lib/pagarme';
import { revalidatePath } from 'next/cache';

const PLATFORM_RECIPIENT_ID = process.env.PAGARME_PLATFORM_RECIPIENT_ID || '';

interface CreateEventPaymentInput {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone?: string;
  paymentMethod: 'pix' | 'credit_card' | 'boleto' | 'cash';
}

export async function createEventPayment(input: CreateEventPaymentInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();

  if (!profile?.church_id) {
    return { error: 'Perfil não encontrado' };
  }

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('id, title, price, church_id')
    .eq('id', input.eventId)
    .single();

  if (!event) {
    return { error: 'Evento não encontrado' };
  }

  if (!event.price || event.price <= 0) {
    return { error: 'Este evento é gratuito' };
  }

  // Check if user already has a pending or paid payment for this event
  const { data: existingPayment } = await supabase
    .from('event_payments')
    .select('id, status')
    .eq('event_id', input.eventId)
    .eq('user_id', user.id)
    .in('status', ['paid', 'awaiting_confirmation'])
    .single();

  if (existingPayment) {
    if (existingPayment.status === 'paid') {
      return { error: 'Você já pagou por este evento' };
    }
    if (existingPayment.status === 'awaiting_confirmation') {
      return { error: 'Você já tem um pagamento aguardando confirmação' };
    }
  }

  const amountCents = Math.round(event.price * 100);
  const platformFeeCents = Math.round(amountCents * 0.01); // 1% for platform
  const churchAmountCents = amountCents - platformFeeCents; // 99% for church

  // Handle cash payment (payment at church)
  if (input.paymentMethod === 'cash') {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours to confirm

    const { data: payment, error: paymentError } = await supabase
      .from('event_payments')
      .insert({
        event_id: input.eventId,
        user_id: user.id,
        church_id: event.church_id,
        order_id: null,
        amount_cents: amountCents,
        platform_fee_cents: 0, // No platform fee for cash
        church_amount_cents: amountCents, // 100% for church
        status: 'awaiting_confirmation',
        payment_method: 'cash',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving cash payment:', paymentError);
      return { error: 'Erro ao registrar pagamento' };
    }

    // Register user for event with pending status
    await supabase
      .from('event_registrations')
      .upsert({
        event_id: input.eventId,
        profile_id: user.id,
        status: 'pending',
        payment_status: 'awaiting_confirmation'
      }, {
        onConflict: 'event_id,profile_id'
      });

    revalidatePath('/eventos');

    return {
      success: true,
      paid: false,
      paymentId: payment.id,
      paymentMethod: 'cash',
      expiresAt: expiresAt.toISOString(),
      message: 'Inscrição registrada! Efetue o pagamento na igreja em até 72 horas para confirmar sua inscrição.'
    };
  }

  // For online payments, check church recipient
  const { data: church } = await supabase
    .from('churches')
    .select('pagarme_recipient_id')
    .eq('id', event.church_id)
    .single();

  if (!church?.pagarme_recipient_id) {
    return { error: 'Igreja não configurada para receber pagamentos online' };
  }

  // Create split rules
  const splitRules = createSplitRules(
    amountCents,
    church.pagarme_recipient_id,
    PLATFORM_RECIPIENT_ID
  );

  try {
    // Create order in Pagar.me
    const document = input.customerDocument.replace(/\D/g, '');
    const documentType = document.length > 11 ? 'CNPJ' : 'CPF';
    const customerType = document.length > 11 ? 'company' : 'individual';
    
    const order = await createOrder({
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        document: document,
        document_type: documentType,
        type: customerType,
        phones: input.customerPhone ? {
          mobile_phone: {
            country_code: '55',
            area_code: input.customerPhone.replace(/\D/g, '').substring(0, 2),
            number: input.customerPhone.replace(/\D/g, '').substring(2)
          }
        } : undefined
      },
      items: [{
        code: event.id,
        description: `Inscrição: ${event.title}`,
        quantity: 1,
        amount: amountCents
      }],
      payments: [{
        payment_method: input.paymentMethod as 'credit_card' | 'pix',
        amount: amountCents,
        ...(input.paymentMethod === 'pix' ? {
          pix: {
            expires_in: 3600 // 1 hour
          }
        } : {}),
        split: splitRules
      }]
    });

    // Save payment record
    const { data: payment, error: paymentError } = await supabase
      .from('event_payments')
      .insert({
        event_id: input.eventId,
        user_id: user.id,
        church_id: event.church_id,
        order_id: order.id,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        church_amount_cents: churchAmountCents,
        status: 'pending',
        payment_method: input.paymentMethod
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
      return { error: 'Erro ao salvar pagamento' };
    }

    // Return payment info based on method
    if (input.paymentMethod === 'pix') {
      const pixCharge = order.charges?.[0];
      const pixTransaction = pixCharge?.last_transaction;
      
      return {
        success: true,
        paid: false,
        paymentId: payment.id,
        orderId: order.id,
        pixQrCode: pixTransaction?.qr_code,
        pixQrCodeUrl: pixTransaction?.qr_code_url,
        expiresAt: pixTransaction?.expires_at
      };
    }

    return {
      success: true,
      paid: false,
      paymentId: payment.id,
      orderId: order.id
    };

  } catch (error) {
    console.error('Error creating event payment:', error);
    return { error: 'Erro ao processar pagamento' };
  }
}

export async function confirmCashPayment(paymentId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  // Check if user is admin/pastor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, church_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['pastor', 'pastora', 'admin'].includes(profile.role)) {
    return { error: 'Sem permissão para confirmar pagamentos' };
  }

  // Get payment
  const { data: payment } = await supabase
    .from('event_payments')
    .select('*, event:events(id, title)')
    .eq('id', paymentId)
    .eq('church_id', profile.church_id)
    .eq('status', 'awaiting_confirmation')
    .single();

  if (!payment) {
    return { error: 'Pagamento não encontrado ou já processado' };
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('event_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      confirmed_by: user.id
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('Error confirming payment:', updateError);
    return { error: 'Erro ao confirmar pagamento' };
  }

  // Update event registration
  await supabase
    .from('event_registrations')
    .update({
      status: 'confirmed',
      payment_status: 'paid'
    })
    .eq('event_id', payment.event_id)
    .eq('profile_id', payment.user_id);

  revalidatePath('/dashboard/financeiro');
  revalidatePath('/eventos');

  return { success: true, message: 'Pagamento confirmado com sucesso!' };
}

export async function rejectCashPayment(paymentId: string, reason?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  // Check if user is admin/pastor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, church_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['pastor', 'pastora', 'admin'].includes(profile.role)) {
    return { error: 'Sem permissão para rejeitar pagamentos' };
  }

  // Get payment
  const { data: payment } = await supabase
    .from('event_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('church_id', profile.church_id)
    .eq('status', 'awaiting_confirmation')
    .single();

  if (!payment) {
    return { error: 'Pagamento não encontrado ou já processado' };
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('event_payments')
    .update({
      status: 'cancelled',
      rejection_reason: reason
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('Error rejecting payment:', updateError);
    return { error: 'Erro ao rejeitar pagamento' };
  }

  // Update event registration
  await supabase
    .from('event_registrations')
    .update({
      status: 'cancelled',
      payment_status: 'cancelled'
    })
    .eq('event_id', payment.event_id)
    .eq('profile_id', payment.user_id);

  revalidatePath('/dashboard/financeiro');
  revalidatePath('/eventos');

  return { success: true, message: 'Pagamento rejeitado' };
}

export async function getPendingCashPayments() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado', payments: [] };
  }

  // Check if user is admin/pastor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, church_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['pastor', 'pastora', 'admin'].includes(profile.role)) {
    return { error: 'Sem permissão', payments: [] };
  }

  const { data: payments, error } = await supabase
    .from('event_payments')
    .select(`
      *,
      event:events(id, title, start_date),
      user:profiles!event_payments_user_id_fkey(id, full_name, email, phone)
    `)
    .eq('church_id', profile.church_id)
    .eq('status', 'awaiting_confirmation')
    .eq('payment_method', 'cash')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending payments:', error);
    return { error: 'Erro ao buscar pagamentos', payments: [] };
  }

  return { payments };
}

export async function cancelExpiredCashPayments() {
  const supabase = await createClient();
  
  // Find expired payments (older than 72 hours)
  const { data: expiredPayments, error } = await supabase
    .from('event_payments')
    .select('id, event_id, user_id')
    .eq('status', 'awaiting_confirmation')
    .eq('payment_method', 'cash')
    .lt('expires_at', new Date().toISOString());

  if (error || !expiredPayments?.length) {
    return { cancelled: 0 };
  }

  // Cancel each expired payment
  for (const payment of expiredPayments) {
    await supabase
      .from('event_payments')
      .update({ status: 'expired' })
      .eq('id', payment.id);

    await supabase
      .from('event_registrations')
      .update({
        status: 'cancelled',
        payment_status: 'expired'
      })
      .eq('event_id', payment.event_id)
      .eq('profile_id', payment.user_id);
  }

  return { cancelled: expiredPayments.length };
}

export async function checkEventPaymentStatus(paymentId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const { data: payment } = await supabase
    .from('event_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .single();

  if (!payment) {
    return { error: 'Pagamento não encontrado' };
  }

  if (payment.status === 'paid') {
    return { status: 'paid', paid: true };
  }

  if (payment.status === 'awaiting_confirmation') {
    return { status: 'awaiting_confirmation', paid: false, message: 'Aguardando confirmação do pagamento na igreja' };
  }

  if (payment.status === 'expired') {
    return { status: 'expired', paid: false, message: 'Pagamento expirado. O prazo de 72 horas foi excedido.' };
  }

  // Check with Pagar.me for online payments
  if (payment.order_id) {
    try {
      const order = await getOrder(payment.order_id);
      const charge = order.charges?.[0];
      
      if (charge?.status === 'paid') {
        // Update payment status
        await supabase
          .from('event_payments')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        // Register user for event
        await supabase
          .from('event_registrations')
          .upsert({
            event_id: payment.event_id,
            profile_id: user.id,
            status: 'confirmed',
            payment_status: 'paid'
          }, {
            onConflict: 'event_id,profile_id'
          });

        revalidatePath('/eventos');
        return { status: 'paid', paid: true };
      }

      return { status: charge?.status || 'pending', paid: false };
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }

  return { status: payment.status, paid: false };
}

export async function getUserEventPayments() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado', payments: [] };
  }

  const { data: payments, error } = await supabase
    .from('event_payments')
    .select(`
      *,
      event:events(id, title, start_date)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: 'Erro ao buscar pagamentos', payments: [] };
  }

  return { payments };
}

export async function hasUserPaidForEvent(eventId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { data: payment } = await supabase
    .from('event_payments')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .single();

  return !!payment;
}
