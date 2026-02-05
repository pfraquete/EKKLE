import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import crypto from 'crypto';
import { processWebhookWithRetry } from '@/lib/webhook-retry';
import { logger } from '@/lib/logger';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Helper to create Supabase client for webhooks
 */
function createSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

interface PagarmeWebhookPayload {
  id: string;
  type: string;
  created_at: string;
  data: {
    id: string;
    code: string;
    status: string;
    amount: number;
    customer?: {
      id: string;
      name: string;
      email: string;
    };
    charges?: Array<{
      id: string;
      status: string;
      amount: number;
      paid_at?: string;
      payment_method: string;
      last_transaction?: {
        id: string;
        status: string;
        success: boolean;
      };
    }>;
    metadata?: {
      church_id?: string;
      plan_id?: string;
      type?: string;
    };
  };
}

/**
 * Verify Pagar.me webhook signature
 * Pagar.me uses HMAC-SHA256 for webhook verification
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
  
  // If no secret configured, log warning but allow (for development)
  if (!webhookSecret) {
    logger.warn('[Pagar.me Webhook] PAGARME_WEBHOOK_SECRET not configured - skipping signature verification');
    return true;
  }
  
  if (!signature) {
    logger.warn('[Pagar.me Webhook] Missing x-hub-signature header');
    return false;
  }
  
  // Pagar.me sends signature as "sha256=HASH"
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Sanitize webhook payload to remove PII before storing
 */
function sanitizeWebhookPayload(payload: PagarmeWebhookPayload): Record<string, unknown> {
  return {
    id: payload.id,
    type: payload.type,
    created_at: payload.created_at,
    order_id: payload.data?.id,
    order_code: payload.data?.code,
    order_status: payload.data?.status,
    amount: payload.data?.amount,
    metadata: payload.data?.metadata,
    charges_count: payload.data?.charges?.length || 0,
    first_charge_status: payload.data?.charges?.[0]?.status,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature');
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      logger.warn('[Pagar.me Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const payload: PagarmeWebhookPayload = JSON.parse(body);
    
    logger.info('[Pagar.me Webhook] Received', {
      type: payload.type,
      orderId: payload.data?.id,
      status: payload.data?.status,
    });

    const supabase = createSupabaseClient();
    
    // Log webhook event (sanitized to remove PII)
    await supabase.from('webhook_events').insert({
      event_type: payload.type,
      stripe_event_id: payload.id, // Reusing column for Pagar.me event ID
      payload: sanitizeWebhookPayload(payload),
      processed: false,
    });

    // Handle different event types with retry support
    const { success, error: processError } = await processWebhookWithRetry(
      supabase,
      'pagarme',
      payload.id,
      payload.type,
      sanitizeWebhookPayload(payload),
      async () => {
        switch (payload.type) {
          case 'order.paid':
            await handleOrderPaid(payload.data);
            break;
          
          case 'order.payment_failed':
            await handlePaymentFailed(payload.data);
            break;
          
          case 'order.canceled':
            await handleOrderCanceled(payload.data);
            break;
          
          case 'charge.paid':
            await handleChargePaid(payload.data);
            break;
          
          default:
            logger.debug('[Pagar.me Webhook] Unhandled event type', { eventType: payload.type });
        }
      }
    );
    
    // Mark webhook as processed (or failed)
    await supabase
      .from('webhook_events')
      .update({
        processed: success,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', payload.id);
    
    if (!success) {
      logger.warn('[Pagar.me Webhook] Event queued for retry', { eventId: payload.id });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('[Pagar.me Webhook] Error processing webhook', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOrderPaid(data: PagarmeWebhookPayload['data']) {
  const supabase = createSupabaseClient();
  const orderId = data.id;
  const metadata = data.metadata;
  const charge = data.charges?.[0];
  
  logger.info('[Pagar.me Webhook] Order paid', { orderId, type: metadata?.type });
  
  // Handle course payment
  if (metadata?.type === 'course_payment') {
    const { error } = await supabase
      .from('course_payments')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (error) {
      logger.error('[Pagar.me Webhook] Error updating course payment', error);
      throw error;
    }
    
    logger.info('[Pagar.me Webhook] Course payment confirmed', { orderId });
    logger.webhook('pagarme', 'order.paid', true, { orderId, type: 'course_payment' });
    return;
  }
  
  // Handle event payment
  if (metadata?.type === 'event_payment') {
    const { error } = await supabase
      .from('event_payments')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (error) {
      logger.error('[Pagar.me Webhook] Error updating event payment', error);
      throw error;
    }
    
    logger.info('[Pagar.me Webhook] Event payment confirmed', { orderId });
    logger.webhook('pagarme', 'order.paid', true, { orderId, type: 'event_payment' });
    return;
  }
  
  // Handle cell offering payment
  if (metadata?.type === 'cell_offering') {
    const { error } = await supabase
      .from('cell_offerings')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (error) {
      logger.error('[Pagar.me Webhook] Error updating cell offering', error);
      throw error;
    }
    
    logger.info('[Pagar.me Webhook] Cell offering confirmed', { orderId });
    logger.webhook('pagarme', 'order.paid', true, { orderId, type: 'cell_offering' });
    return;
  }
  
  // Handle store order payment
  if (metadata?.type === 'store_order') {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (error) {
      logger.error('[Pagar.me Webhook] Error updating store order', error);
      throw error;
    }
    
    logger.info('[Pagar.me Webhook] Store order confirmed', { orderId });
    logger.webhook('pagarme', 'order.paid', true, { orderId, type: 'store_order' });
    return;
  }
  
  // Check if this is an annual subscription payment
  if (metadata?.type === 'annual_subscription') {
    // Update subscription status to active
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (subscriptionError) {
      logger.error('[Pagar.me Webhook] Error updating subscription', subscriptionError);
      throw subscriptionError;
    } else {
      logger.info('[Pagar.me Webhook] Subscription activated', { orderId });
    }
    
    // Update invoice status
    const { error: invoiceError } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_invoice_id', orderId);
    
    if (invoiceError) {
      logger.error('[Pagar.me Webhook] Error updating invoice', invoiceError);
    }
  }
  
  logger.webhook('pagarme', 'order.paid', true, { orderId });
}

async function handlePaymentFailed(data: PagarmeWebhookPayload['data']) {
  const supabase = createSupabaseClient();
  const orderId = data.id;
  
  logger.info('[Pagar.me Webhook] Payment failed', { orderId });
  
  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_order_id', orderId);
  
  if (error) {
    logger.error('[Pagar.me Webhook] Error updating subscription', error);
    throw error;
  }
  
  // Update invoice status
  await supabase
    .from('subscription_invoices')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_invoice_id', orderId);
  
  logger.webhook('pagarme', 'order.payment_failed', true, { orderId });
}

async function handleOrderCanceled(data: PagarmeWebhookPayload['data']) {
  const supabase = createSupabaseClient();
  const orderId = data.id;
  
  logger.info('[Pagar.me Webhook] Order canceled', { orderId });
  
  // Update subscription status to canceled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_order_id', orderId);
  
  if (error) {
    logger.error('[Pagar.me Webhook] Error updating subscription', error);
    throw error;
  }
  
  // Update invoice status
  await supabase
    .from('subscription_invoices')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_invoice_id', orderId);
  
  logger.webhook('pagarme', 'order.canceled', true, { orderId });
}

async function handleChargePaid(data: PagarmeWebhookPayload['data']) {
  // This is triggered when a charge within an order is paid
  // For PIX payments, this confirms the payment
  logger.info('[Pagar.me Webhook] Charge paid', { chargeId: data.id });
  
  // The order.paid event should handle the subscription update
  // This is just for logging purposes
  logger.webhook('pagarme', 'charge.paid', true, { chargeId: data.id });
}
