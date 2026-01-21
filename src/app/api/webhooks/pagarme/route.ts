import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAGARME_API_KEY = process.env.PAGARME_API_KEY || '';

// Validate Pagar.me postback signature
function validateSignature(signature: string | null, payload: string): boolean {
  if (!signature || !PAGARME_API_KEY) return false;

  const expectedSignature = crypto
    .createHmac('sha1', PAGARME_API_KEY)
    .update(payload)
    .digest('hex');

  return signature === `sha1=${expectedSignature}` || signature === expectedSignature;
}

// Map Pagar.me status to our status
function mapSubscriptionStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    trialing: 'trialing',
    paid: 'active',
    pending_payment: 'pending',
    unpaid: 'unpaid',
    canceled: 'canceled',
    ended: 'expired',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

function mapInvoiceStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: 'paid',
    pending_payment: 'pending',
    waiting_payment: 'pending',
    refused: 'failed',
    refunded: 'refunded',
    canceled: 'canceled',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature');

    // Log webhook event
    const eventData = JSON.parse(payload);
    
    // Save webhook event to database
    await supabase.from('webhook_events').insert({
      event_type: eventData.event || eventData.object || 'unknown',
      pagarme_event_id: eventData.id?.toString(),
      payload: eventData,
      processed: false,
    });

    // Validate signature (optional in development)
    if (process.env.NODE_ENV === 'production') {
      if (!validateSignature(signature, payload)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = eventData.event;
    const object = eventData.object;

    console.log(`Processing Pagar.me webhook: ${event} for ${object}`);

    // Handle subscription events
    if (object === 'subscription') {
      await handleSubscriptionEvent(eventData);
    }

    // Handle transaction events (for invoices)
    if (object === 'transaction') {
      await handleTransactionEvent(eventData);
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('pagarme_event_id', eventData.id?.toString());

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);

    // Log error
    await supabase.from('webhook_events').insert({
      event_type: 'error',
      payload: { error: error.message },
      processed: false,
      error: error.message,
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionEvent(eventData: any) {
  const subscriptionId = eventData.id?.toString();
  const status = mapSubscriptionStatus(eventData.status);
  const currentPeriodEnd = eventData.current_period_end;

  if (!subscriptionId) {
    console.error('No subscription ID in event');
    return;
  }

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
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (currentPeriodEnd) {
    updateData.current_period_end = new Date(currentPeriodEnd).toISOString();
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

async function handleTransactionEvent(eventData: any) {
  const transactionId = eventData.id?.toString();
  const status = mapInvoiceStatus(eventData.status);
  const subscriptionId = eventData.subscription_id?.toString();

  if (!transactionId) {
    console.error('No transaction ID in event');
    return;
  }

  // Try to find invoice by transaction ID
  let { data: invoice, error: findError } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('pagarme_charge_id', transactionId)
    .single();

  // If not found by charge ID, try to find by subscription and create new invoice
  if (findError && subscriptionId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('pagarme_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      // Create new invoice record
      const { data: newInvoice, error: insertError } = await supabase
        .from('subscription_invoices')
        .insert({
          subscription_id: subscription.id,
          church_id: subscription.church_id,
          pagarme_charge_id: transactionId,
          amount_cents: eventData.amount || subscription.plan?.price_cents || 0,
          status,
          payment_method: eventData.payment_method,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
          boleto_url: eventData.boleto_url,
          boleto_barcode: eventData.boleto_barcode,
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
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    if (eventData.boleto_url) {
      updateData.boleto_url = eventData.boleto_url;
      updateData.boleto_barcode = eventData.boleto_barcode;
    }

    const { error: updateError } = await supabase
      .from('subscription_invoices')
      .update(updateData)
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
    }

    console.log(`Invoice ${invoice.id} updated to status: ${status}`);

    // If payment was successful, ensure subscription is active
    if (status === 'paid' && subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('pagarme_subscription_id', subscriptionId);
    }
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
