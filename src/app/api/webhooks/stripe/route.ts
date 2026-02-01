import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'
import { processWebhookWithRetry } from '@/lib/webhook-retry'
import { logger } from '@/lib/logger'

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
    // Cast through unknown to satisfy TypeScript strict mode
    const obj = event.data.object as unknown as Record<string, unknown>
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
            logger.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
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
            logger.warn('[Webhook] Signature verification failed')
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

        // Handle different event types with retry support
        const { success, error: processError } = await processWebhookWithRetry(
            supabase,
            'stripe',
            event.id,
            event.type,
            sanitizeWebhookPayload(event),
            async () => {
                switch (event.type) {
                    case 'checkout.session.completed':
                        await handleCheckoutSessionCompleted(event.data.object)
                        break

                    case 'checkout.session.expired':
                        await handleCheckoutSessionExpired(event.data.object)
                        break

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
                        logger.debug('[Webhook] Unhandled event type', { eventType: event.type })
                }
            }
        )

        // Mark webhook as processed (or failed)
        await supabase
            .from('webhook_events')
            .update({
                processed: success,
                processed_at: new Date().toISOString(),
            })
            .eq('stripe_event_id', event.id)

        if (!success) {
            logger.warn('[Webhook] Event queued for retry', { eventId: event.id })
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        logger.error('[Webhook] Error', error)
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
        logger.error('[handleInvoicePaid] Subscription update error', subError)
    }

    // Create invoice record
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, church_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

    if (subscription) {
        // Safely handle paid_at - can be null/undefined for some invoice types
        const paidAtTimestamp = invoice.status_transitions?.paid_at
        const paidAt = paidAtTimestamp
            ? new Date(paidAtTimestamp * 1000).toISOString()
            : new Date().toISOString()

        await supabase.from('subscription_invoices').insert({
            subscription_id: subscription.id,
            church_id: subscription.church_id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount_cents: invoice.amount_paid,
            status: 'paid',
            paid_at: paidAt,
            payment_method: invoice.payment_method_types?.[0] || 'card',
        })
    }

    logger.webhook('stripe', 'invoice.paid', true, { subscriptionId })
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
        logger.error('[handleInvoicePaymentFailed] Error', error)
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

    logger.webhook('stripe', 'invoice.payment_failed', true, { subscriptionId })
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
        logger.error('[handleSubscriptionUpdated] Error', error)
    }

    logger.webhook('stripe', 'subscription.updated', true, { subscriptionId: subscription.id })
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
        logger.error('[handleSubscriptionDeleted] Error', error)
    }

    logger.webhook('stripe', 'subscription.deleted', true, { subscriptionId: subscription.id })
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
        logger.error('[handleSubscriptionCreated] No church_id in metadata')
        return
    }

    // Get plan_id from price
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', subscription.items.data[0].price.id)
        .single()

    if (!plan) {
        logger.error('[handleSubscriptionCreated] Plan not found')
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
        logger.error('[handleSubscriptionCreated] Error', error)
    }

    logger.webhook('stripe', 'subscription.created', true, { subscriptionId: subscription.id, churchId })
}

/**
 * Handle checkout.session.completed event
 * Specifically for church creation flow
 */
async function handleCheckoutSessionCompleted(session: any) {
    const supabase = createSupabaseClient()

    // Check if this is a church creation checkout
    if (session.metadata?.type !== 'church_creation') {
        // Normal subscription checkout - subscription.created will handle it
        logger.debug('[handleCheckoutSessionCompleted] Not a church creation checkout')
        return
    }

    const pendingRequestId = session.metadata.pending_request_id
    const userId = session.metadata.user_id
    const churchName = session.metadata.church_name
    const churchSlug = session.metadata.church_slug
    const planId = session.metadata.plan_id

    if (!pendingRequestId || !userId || !churchName || !churchSlug) {
        logger.error('[handleCheckoutSessionCompleted] Missing required metadata', {
            pendingRequestId,
            userId,
            churchName,
            churchSlug
        })
        return
    }

    // Fetch pending request
    const { data: pendingRequest, error: fetchError } = await supabase
        .from('pending_church_requests')
        .select('*')
        .eq('id', pendingRequestId)
        .single()

    if (fetchError || !pendingRequest) {
        logger.error('[handleCheckoutSessionCompleted] Pending request not found', { pendingRequestId })
        return
    }

    // Idempotency check: already completed
    if (pendingRequest.status === 'completed') {
        logger.info('[handleCheckoutSessionCompleted] Already completed, skipping', { pendingRequestId })
        return
    }

    // Mark as processing to prevent duplicate processing
    await supabase
        .from('pending_church_requests')
        .update({ status: 'payment_processing' })
        .eq('id', pendingRequestId)

    try {
        // 1. Create the church
        const { data: newChurch, error: churchError } = await supabase
            .from('churches')
            .insert({
                name: churchName,
                slug: churchSlug,
                website_settings: {},
            })
            .select()
            .single()

        if (churchError || !newChurch) {
            throw new Error(`Failed to create church: ${churchError?.message}`)
        }

        logger.info('[handleCheckoutSessionCompleted] Church created', {
            churchId: newChurch.id,
            slug: churchSlug
        })

        // 2. Update user profile: upgrade to PASTOR, move to new church
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                church_id: newChurch.id,
                role: 'PASTOR',
                member_stage: 'LEADER',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (profileError) {
            // Rollback church creation
            logger.error('[handleCheckoutSessionCompleted] Profile update failed, rolling back church', profileError)
            await supabase.from('churches').delete().eq('id', newChurch.id)
            throw new Error(`Failed to update profile: ${profileError.message}`)
        }

        logger.info('[handleCheckoutSessionCompleted] Profile upgraded to PASTOR', { userId })

        // 3. Create subscription record for the new church
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // Get plan details
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('id', planId)
            .single()

        if (plan) {
            const { error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    church_id: newChurch.id,
                    plan_id: plan.id,
                    stripe_subscription_id: subscriptionId,
                    stripe_customer_id: customerId,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })

            if (subError) {
                logger.error('[handleCheckoutSessionCompleted] Subscription record error', subError)
                // Don't rollback - church is created, subscription will sync via invoice.paid
            }
        }

        // 4. Mark pending request as completed
        await supabase
            .from('pending_church_requests')
            .update({
                status: 'completed',
                stripe_subscription_id: subscriptionId,
                completed_at: new Date().toISOString(),
            })
            .eq('id', pendingRequestId)

        logger.webhook('stripe', 'checkout.session.completed', true, {
            type: 'church_creation',
            churchId: newChurch.id,
            userId,
            subscriptionId,
        })

    } catch (error) {
        logger.error('[handleCheckoutSessionCompleted] Error during church creation', error)

        // Mark pending request as failed
        await supabase
            .from('pending_church_requests')
            .update({
                status: 'failed',
                metadata: {
                    ...pendingRequest.metadata,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    failed_at: new Date().toISOString(),
                },
            })
            .eq('id', pendingRequestId)

        throw error // Re-throw so webhook retry can handle it
    }
}

/**
 * Handle checkout.session.expired event
 * Marks pending church requests as expired
 */
async function handleCheckoutSessionExpired(session: any) {
    // Only handle church creation checkouts
    if (session.metadata?.type !== 'church_creation') {
        return
    }

    const supabase = createSupabaseClient()
    const pendingRequestId = session.metadata.pending_request_id

    if (!pendingRequestId) {
        return
    }

    const { error } = await supabase
        .from('pending_church_requests')
        .update({ status: 'expired' })
        .eq('id', pendingRequestId)
        .eq('status', 'pending_payment')

    if (error) {
        logger.error('[handleCheckoutSessionExpired] Error', error)
    }

    logger.webhook('stripe', 'checkout.session.expired', true, {
        type: 'church_creation',
        pendingRequestId,
    })
}
