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
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
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

  // Check if user already paid for this event
  const { data: existingPayment } = await supabase
    .from('event_payments')
    .select('id, status')
    .eq('event_id', input.eventId)
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .single();

  if (existingPayment) {
    return { error: 'Você já pagou por este evento' };
  }

  // Get church recipient for split
  const { data: church } = await supabase
    .from('churches')
    .select('pagarme_recipient_id')
    .eq('id', event.church_id)
    .single();

  if (!church?.pagarme_recipient_id) {
    return { error: 'Igreja não configurada para receber pagamentos' };
  }

  const amountCents = Math.round(event.price * 100);
  const platformFeeCents = Math.round(amountCents * 0.01); // 1% for platform
  const churchAmountCents = amountCents - platformFeeCents; // 99% for church

  // Create split rules
  const splitRules = createSplitRules(
    amountCents,
    church.pagarme_recipient_id,
    PLATFORM_RECIPIENT_ID
  );

  try {
    // Create order in Pagar.me
    const order = await createOrder({
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        document: input.customerDocument.replace(/\D/g, ''),
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
        payment_method: input.paymentMethod,
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
        paymentId: payment.id,
        orderId: order.id,
        pixQrCode: pixTransaction?.qr_code,
        pixQrCodeUrl: pixTransaction?.qr_code_url,
        expiresAt: pixTransaction?.expires_at
      };
    }

    return {
      success: true,
      paymentId: payment.id,
      orderId: order.id
    };

  } catch (error) {
    console.error('Error creating event payment:', error);
    return { error: 'Erro ao processar pagamento' };
  }
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

  // Check with Pagar.me
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
