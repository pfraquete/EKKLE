import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAGARME_WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET || '';

// Validate Pagar.me webhook signature (API v5)
function validateSignature(signature: string | null, payload: string): boolean {
  if (!signature || !PAGARME_WEBHOOK_SECRET) {
    console.log('Missing signature or webhook secret');
    return false;
  }

  // Pagar.me v5 usa HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', PAGARME_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // A assinatura pode vir com prefixo sha256= ou não
  const cleanSignature = signature.replace('sha256=', '');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Se os buffers tiverem tamanhos diferentes
    return cleanSignature === expectedSignature;
  }
}

// Map Pagar.me v5 status to our status
function mapSubscriptionStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    future: 'pending',
    pending: 'pending',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

function mapInvoiceStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: 'paid',
    pending: 'pending',
    scheduled: 'pending',
    canceled: 'canceled',
    failed: 'failed',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

function mapChargeStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: 'paid',
    pending: 'pending',
    processing: 'pending',
    failed: 'failed',
    canceled: 'canceled',
    overpaid: 'paid',
    underpaid: 'pending',
    chargedback: 'refunded',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature');

    // Parse event data
    let eventData: {
      type?: string;
      id?: string | number;
      status?: string;
      current_cycle?: { end_at?: string };
      charge?: unknown;
      subscription?: { id?: string | number };
      data?: unknown;
    };
    try {
      eventData = JSON.parse(payload);
    } catch {
      console.error('Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Log webhook event
    const eventType = eventData.type || 'unknown';
    console.log(`Received Pagar.me webhook: ${eventType}`);

    // Save webhook event to database
    await supabase.from('webhook_events').insert({
      event_type: eventType,
      pagarme_event_id: eventData.id?.toString(),
      payload: eventData,
      processed: false,
    });

    // Validate signature in production
    if (process.env.NODE_ENV === 'production' && PAGARME_WEBHOOK_SECRET) {
      if (!validateSignature(signature, payload)) {
        console.error('Invalid webhook signature');
        
        // Update event with error
        await supabase
          .from('webhook_events')
          .update({ error: 'Invalid signature' })
          .eq('pagarme_event_id', eventData.id?.toString());
          
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process event based on type
    const data = eventData.data ?? eventData;
    
    switch (eventType) {
      // Subscription events
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.canceled':
        await handleSubscriptionEvent(eventType, data as { id?: string | number; status?: string; current_cycle?: { end_at?: string } });
        break;

      // Invoice events
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.canceled':
        await handleInvoiceEvent(eventType, data as { id?: string | number; subscription?: { id?: string | number }; status?: string; amount?: number; due_at?: string; charge?: { id?: string | number; payment_method?: string; last_transaction?: { boleto_url?: string; boleto_barcode?: string; qr_code?: string; qr_code_url?: string } } });
        break;

      // Charge events
      case 'charge.created':
      case 'charge.updated':
      case 'charge.paid':
      case 'charge.payment_failed':
      case 'charge.refunded':
      case 'charge.pending':
        await handleChargeEvent(eventType, data as { id?: string | number; status?: string; last_transaction?: { boleto_url?: string; boleto_barcode?: string; qr_code?: string; qr_code_url?: string } });
        break;

      // Order events (marketplace)
      case 'order.created':
      case 'order.updated':
      case 'order.paid':
      case 'order.payment_failed':
      case 'order.canceled':
        await handleOrderEvent(eventType, data as { id?: string | number; status?: string; charges?: Array<{ id?: string | number; status?: string; payment_method?: string; paid_at?: string; last_transaction?: { id?: string | number; qr_code?: string; qr_code_url?: string; expires_at?: string } }> });
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('pagarme_event_id', eventData.id?.toString());

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error
    await supabase.from('webhook_events').insert({
      event_type: 'error',
      payload: { error: errorMessage },
      processed: false,
      error: errorMessage,
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionEvent(eventType: string, data: { id?: string | number; status?: string; current_cycle?: { end_at?: string } }) {
  const subscriptionId = data?.id?.toString();
  const status = mapSubscriptionStatus(data?.status || '');

  if (!subscriptionId) {
    console.error('No subscription ID in event');
    return;
  }

  console.log(`Processing subscription event: ${eventType} for ${subscriptionId}`);

  // Find subscription by Pagar.me ID
  const { data: subscription, error: findError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('pagarme_subscription_id', subscriptionId)
    .single();

  if (findError || !subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  // Update subscription status
  const updateData: {
    status: string;
    updated_at: string;
    current_period_end?: string;
    canceled_at?: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Update period end from current cycle
  if (data?.current_cycle?.end_at) {
    updateData.current_period_end = data.current_cycle.end_at;
  }

  if (status === 'canceled') {
    updateData.canceled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('id', subscription.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
  }

  console.log(`Subscription ${subscriptionId} updated to status: ${status}`);
}

async function handleInvoiceEvent(eventType: string, data: { id?: string | number; subscription?: { id?: string | number }; status?: string; amount?: number; due_at?: string; charge?: { id?: string | number; payment_method?: string; last_transaction?: { boleto_url?: string; boleto_barcode?: string; qr_code?: string; qr_code_url?: string } } }) {
  const invoiceId = data?.id?.toString();
  const subscriptionId = data?.subscription?.id?.toString();
  const status = mapInvoiceStatus(data?.status || '');

  if (!invoiceId) {
    console.error('No invoice ID in event');
    return;
  }

  console.log(`Processing invoice event: ${eventType} for ${invoiceId}`);

  // Try to find existing invoice
  let { data: invoice } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('pagarme_invoice_id', invoiceId)
    .single();

  // If not found, try to create from subscription
  if (!invoice && subscriptionId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('pagarme_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      const charge = data?.charge;
      const lastTransaction = charge?.last_transaction;

      const { data: newInvoice, error: insertError } = await supabase
        .from('subscription_invoices')
        .insert({
          subscription_id: subscription.id,
          church_id: subscription.church_id,
          pagarme_invoice_id: invoiceId,
          pagarme_charge_id: charge?.id?.toString(),
          amount_cents: data?.amount || subscription.plan?.price_cents || 0,
          status,
          payment_method: charge?.payment_method,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
          due_date: data?.due_at,
          boleto_url: lastTransaction?.boleto_url,
          boleto_barcode: lastTransaction?.boleto_barcode,
          pix_qr_code: lastTransaction?.qr_code,
          pix_qr_code_url: lastTransaction?.qr_code_url,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating invoice:', insertError);
      } else {
        invoice = newInvoice;
      }
    }
  }

  if (invoice) {
    // Update invoice status
    const updateData: {
      status: string;
      updated_at: string;
      paid_at?: string;
      boleto_url?: string;
      boleto_barcode?: string;
      pix_qr_code?: string;
      pix_qr_code_url?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    // Update boleto/pix info if available
    const charge = data?.charge;
    const lastTransaction = charge?.last_transaction;

    if (lastTransaction?.boleto_url) {
      updateData.boleto_url = lastTransaction.boleto_url;
      updateData.boleto_barcode = lastTransaction.boleto_barcode;
    }

    if (lastTransaction?.qr_code) {
      updateData.pix_qr_code = lastTransaction.qr_code;
      updateData.pix_qr_code_url = lastTransaction.qr_code_url;
    }

    const { error: updateError } = await supabase
      .from('subscription_invoices')
      .update(updateData)
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
    }

    console.log(`Invoice ${invoiceId} updated to status: ${status}`);

    // If payment was successful, ensure subscription is active
    if (status === 'paid' && subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('pagarme_subscription_id', subscriptionId);
    }
  }
}

async function handleChargeEvent(eventType: string, data: { id?: string | number; status?: string; last_transaction?: { boleto_url?: string; boleto_barcode?: string; qr_code?: string; qr_code_url?: string } }) {
  const chargeId = data?.id?.toString();
  const status = mapChargeStatus(data?.status || '');

  if (!chargeId) {
    console.error('No charge ID in event');
    return;
  }

  console.log(`Processing charge event: ${eventType} for ${chargeId}`);

  // Find invoice by charge ID
  const { data: invoice, error: findError } = await supabase
    .from('subscription_invoices')
    .select('*, subscription:subscriptions(*)')
    .eq('pagarme_charge_id', chargeId)
    .single();

  if (findError || !invoice) {
    console.log('Invoice not found for charge:', chargeId);
    return;
  }

  // Update invoice status
  const updateData: {
    status: string;
    updated_at: string;
    paid_at?: string;
    boleto_url?: string;
    boleto_barcode?: string;
    pix_qr_code?: string;
    pix_qr_code_url?: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  // Update boleto/pix info
  const lastTransaction = data?.last_transaction;
  if (lastTransaction?.boleto_url) {
    updateData.boleto_url = lastTransaction.boleto_url;
    updateData.boleto_barcode = lastTransaction.boleto_barcode;
  }
  if (lastTransaction?.qr_code) {
    updateData.pix_qr_code = lastTransaction.qr_code;
    updateData.pix_qr_code_url = lastTransaction.qr_code_url;
  }

  const { error: updateError } = await supabase
    .from('subscription_invoices')
    .update(updateData)
    .eq('id', invoice.id);

  if (updateError) {
    console.error('Error updating invoice from charge:', updateError);
  }

  // Update subscription status if charge was paid
  if (status === 'paid' && invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', invoice.subscription.id);
  }

  console.log(`Invoice ${invoice.id} updated from charge ${chargeId} to status: ${status}`);
}

async function handleOrderEvent(eventType: string, data: { id?: string | number; status?: string; charges?: Array<{ id?: string | number; status?: string; payment_method?: string; paid_at?: string; last_transaction?: { id?: string | number; qr_code?: string; qr_code_url?: string; expires_at?: string } }> }) {
  const orderId = data?.id?.toString();
  const status = data?.status;

  if (!orderId) {
    console.error('No order ID in event');
    return;
  }

  console.log(`Processing order event: ${eventType} for ${orderId}`);

  // Find order by Pagar.me ID
  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('pagarme_order_id', orderId)
    .single();

  if (findError || !order) {
    console.error('Order not found:', orderId);
    return;
  }

  // Map Pagar.me status to our payment status
  const paymentStatus =
    status === 'paid'
      ? 'paid'
      : status === 'failed'
      ? 'failed'
      : status === 'canceled'
      ? 'canceled'
      : 'pending';

  // Map to order status
  const orderStatus =
    status === 'paid'
      ? 'processing'
      : status === 'canceled'
      ? 'canceled'
      : 'pending';

  // Update order
  const updateData: {
    payment_status: string;
    status: string;
    updated_at: string;
    paid_at?: string;
  } = {
    payment_status: paymentStatus,
    status: orderStatus,
    updated_at: new Date().toISOString(),
  };

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', order.id);

  if (updateError) {
    console.error('Error updating order:', updateError);
  }

  console.log(`Order ${orderId} updated to payment_status: ${paymentStatus}, status: ${orderStatus}`);

  // Update payment record
  const charge = data?.charges?.[0];
  if (charge && charge.id) {
    const lastTransaction = charge.last_transaction;

    const paymentUpdateData: {
      status: string;
      updated_at: string;
      paid_at?: string;
      failed_at?: string;
      canceled_at?: string;
      pix_qr_code?: string;
      pix_qr_code_url?: string;
      pix_expires_at?: string;
    } = {
      status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === 'paid') {
      paymentUpdateData.paid_at = charge.paid_at || new Date().toISOString();
    } else if (paymentStatus === 'failed') {
      paymentUpdateData.failed_at = new Date().toISOString();
    } else if (paymentStatus === 'canceled') {
      paymentUpdateData.canceled_at = new Date().toISOString();
    }

    // Update PIX info if available
    if (lastTransaction?.qr_code) {
      paymentUpdateData.pix_qr_code = lastTransaction.qr_code;
      paymentUpdateData.pix_qr_code_url = lastTransaction.qr_code_url;
      paymentUpdateData.pix_expires_at = lastTransaction.expires_at;
    }

    const { error: paymentUpdateError } = await supabase
      .from('order_payments')
      .update(paymentUpdateData)
      .eq('pagarme_charge_id', charge.id.toString());

    if (paymentUpdateError) {
      console.error('Error updating order payment:', paymentUpdateError);
    } else {
      console.log(`Order payment updated for charge ${charge.id}`);
    }
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint active',
    endpoint: '/api/webhooks/pagarme',
    version: 'v5'
  });
}
