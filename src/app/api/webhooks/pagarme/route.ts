import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(request: NextRequest) {
  try {
    const payload: PagarmeWebhookPayload = await request.json();
    
    console.log('[Pagar.me Webhook] Received:', {
      type: payload.type,
      orderId: payload.data?.id,
      status: payload.data?.status,
    });

    // Handle different webhook events
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
        console.log('[Pagar.me Webhook] Unhandled event type:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Pagar.me Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOrderPaid(data: PagarmeWebhookPayload['data']) {
  const orderId = data.id;
  const metadata = data.metadata;
  
  console.log('[Pagar.me Webhook] Order paid:', orderId);
  
  // Check if this is an annual subscription payment
  if (metadata?.type === 'annual_subscription') {
    // Update subscription status to active
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_order_id', orderId);
    
    if (subscriptionError) {
      console.error('[Pagar.me Webhook] Error updating subscription:', subscriptionError);
    } else {
      console.log('[Pagar.me Webhook] Subscription activated for order:', orderId);
    }
    
    // Update invoice status
    const charge = data.charges?.[0];
    const { error: invoiceError } = await supabaseAdmin
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: charge?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pagarme_invoice_id', orderId);
    
    if (invoiceError) {
      console.error('[Pagar.me Webhook] Error updating invoice:', invoiceError);
    }
  }
}

async function handlePaymentFailed(data: PagarmeWebhookPayload['data']) {
  const orderId = data.id;
  
  console.log('[Pagar.me Webhook] Payment failed:', orderId);
  
  // Update subscription status to failed
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_order_id', orderId);
  
  if (error) {
    console.error('[Pagar.me Webhook] Error updating subscription:', error);
  }
  
  // Update invoice status
  await supabaseAdmin
    .from('subscription_invoices')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_invoice_id', orderId);
}

async function handleOrderCanceled(data: PagarmeWebhookPayload['data']) {
  const orderId = data.id;
  
  console.log('[Pagar.me Webhook] Order canceled:', orderId);
  
  // Update subscription status to canceled
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_order_id', orderId);
  
  if (error) {
    console.error('[Pagar.me Webhook] Error updating subscription:', error);
  }
  
  // Update invoice status
  await supabaseAdmin
    .from('subscription_invoices')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('pagarme_invoice_id', orderId);
}

async function handleChargePaid(data: PagarmeWebhookPayload['data']) {
  // This is triggered when a charge within an order is paid
  // For PIX payments, this confirms the payment
  console.log('[Pagar.me Webhook] Charge paid:', data.id);
  
  // The order.paid event should handle the subscription update
  // This is just for logging purposes
}

// Verify webhook signature (optional but recommended)
// Pagar.me sends a signature in the x-hub-signature header
// You can implement signature verification here for added security
