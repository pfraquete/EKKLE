import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Lazy initialization of Stripe client
 * Avoids module-level initialization that fails during build
 */
function getStripeClient(): Stripe {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    return new Stripe(apiKey, {
        apiVersion: '2025-12-15.clover',
    })
}

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
                setAll: () => { },
            },
        }
    )
}

/**
 * Sanitize webhook payload to remove PII before storing
 * Only keeps essential fields for debugging/auditing
 */
function sanitizeWebhookPayload(event: Stripe.Event): Record<string, unknown> {
    const safePayload: Record<string, unknown> = {
        id: event.id,
        type: event.type,
        created: event.created,
        livemode: event.livemode,
        api_version: event.api_version,
    }

    // Extract only safe, non-PII data from the event object
    const obj = event.data.object as Record<string, unknown>
    if (obj) {
        safePayload.object_id = obj.id
        safePayload.object_type = obj.object

        // For subscriptions/invoices, keep only IDs and status
        if ('subscription' in obj) safePayload.subscription_id = obj.subscription
        if ('customer' in obj) safePayload.customer_id = obj.customer
        if ('status' in obj) safePayload.status = obj.status
        if ('amount_paid' in obj) safePayload.amount_paid = obj.amount_paid
        if ('amount_due' in obj) safePayload.amount_due = obj.amount_due
        if ('currency' in obj) safePayload.currency = obj.currency
    }

    return safePayload
}

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            )
        }

        // Verify webhook signature with Stripe
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        let event: Stripe.Event

        // SECURITY: Always require webhook secret - no fallback allowed
        if (!webhookSecret) {
            console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            )
        }

        // Verify signature
        try {
            const stripe = getStripeClient()
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err) {
            console.error('[Webhook] Signature verification failed')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        const supabase = createSupabaseClient()

        // Log webhook event (sanitized to remove PII)
        await supabase.from('webhook_events').insert({
            event_type: event.type,
            stripe_event_id: event.id,
            payload: sanitizeWebhookPayload(event),
            processed: false,
        })

        // Handle different event types
        switch (event.type) {
            case 'invoice.paid':
                await handleInvoicePaid(event.data.object)
                break

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object)
                break

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object)
                break

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object)
                break

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object)
                break

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`)
        }

        // Mark webhook as processed
        await supabase
            .from('webhook_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('stripe_event_id', event.id)

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Webhook] Error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}

/**
 * Handle invoice.paid event
 * Activates subscription when payment succeeds
 */
async function handleInvoicePaid(invoice: any) {
    const supabase = createSupabaseClient()

    const subscriptionId = invoice.subscription
    const customerId = invoice.customer

    // Update subscription status to active
    const { error: subError } = await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            current_period_start: new Date(invoice.period_start * 1000).toISOString(),
            current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId)

    if (subError) {
        console.error('[handleInvoicePaid] Subscription update error:', subError)
    }

    // Create invoice record
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, church_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

    if (subscription) {
        await supabase.from('subscription_invoices').insert({
            subscription_id: subscription.id,
            church_id: subscription.church_id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount_cents: invoice.amount_paid,
            status: 'paid',
            paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
            payment_method: invoice.payment_method_types?.[0] || 'card',
        })
    }

    console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`)
}

/**
 * Handle invoice.payment_failed event
 * Marks subscription as past_due when payment fails
 */
async function handleInvoicePaymentFailed(invoice: any) {
    const supabase = createSupabaseClient()

    const subscriptionId = invoice.subscription

    // Update subscription status to past_due
    const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscriptionId)

    if (error) {
        console.error('[handleInvoicePaymentFailed] Error:', error)
    }

    // Create failed invoice record
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, church_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

    if (subscription) {
        await supabase.from('subscription_invoices').insert({
            subscription_id: subscription.id,
            church_id: subscription.church_id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_due,
            status: 'failed',
            payment_method: invoice.payment_method_types?.[0] || 'card',
        })
    }

    console.log(`[Webhook] Payment failed for subscription ${subscriptionId}`)
}

/**
 * Handle customer.subscription.updated event
 * Updates subscription details
 */
async function handleSubscriptionUpdated(subscription: any) {
    const supabase = createSupabaseClient()

    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null,
        })
        .eq('stripe_subscription_id', subscription.id)

    if (error) {
        console.error('[handleSubscriptionUpdated] Error:', error)
    }

    console.log(`[Webhook] Subscription updated: ${subscription.id}`)
}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription: any) {
    const supabase = createSupabaseClient()

    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

    if (error) {
        console.error('[handleSubscriptionDeleted] Error:', error)
    }

    console.log(`[Webhook] Subscription deleted: ${subscription.id}`)
}

/**
 * Handle customer.subscription.created event
 * Creates subscription record
 */
async function handleSubscriptionCreated(subscription: any) {
    const supabase = createSupabaseClient()

    // Get church_id from customer metadata or subscription metadata
    const churchId = subscription.metadata?.church_id

    if (!churchId) {
        console.error('[handleSubscriptionCreated] No church_id in metadata')
        return
    }

    // Get plan_id from price
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', subscription.items.data[0].price.id)
        .single()

    if (!plan) {
        console.error('[handleSubscriptionCreated] Plan not found')
        return
    }

    // Create subscription record
    const { error } = await supabase.from('subscriptions').insert({
        church_id: churchId,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    if (error) {
        console.error('[handleSubscriptionCreated] Error:', error)
    }

    console.log(`[Webhook] Subscription created: ${subscription.id}`)
}
