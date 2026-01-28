'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'

/**
 * Get church subscription status
 */
export async function getChurchSubscription(churchId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_church_subscription', { p_church_id: churchId })
        .single()

    if (error) {
        console.error('[getChurchSubscription] Error:', error)
        return null
    }

    return data
}

/**
 * Check if church has active subscription
 */
export async function hasActiveSubscription(churchId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('has_active_subscription', { p_church_id: churchId })
        .single()

    if (error) {
        console.error('[hasActiveSubscription] Error:', error)
        return false
    }

    return data as boolean
}

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(churchId: string, planId: string) {
    const supabase = await createClient()

    // Get plan details
    const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

    if (planError || !plan) {
        console.error('[createCheckoutSession] Plan error:', planError)
        return { error: 'Plano não encontrado' }
    }

    if (!plan.stripe_price_id) {
        console.error('[createCheckoutSession] Missing stripe_price_id')
        return { error: 'Plano não configurado corretamente' }
    }

    // Get church details
    const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id, name, slug')
        .eq('id', churchId)
        .single()

    if (churchError || !church) {
        console.error('[createCheckoutSession] Church error:', churchError)
        return { error: 'Igreja não encontrada' }
    }

    try {
        // Check if church already has a Stripe customer
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('church_id', churchId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let customerId = existingSubscription?.stripe_customer_id

        // Create or retrieve Stripe customer
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: church.name,
                metadata: {
                    church_id: churchId,
                    church_slug: church.slug,
                },
            })
            customerId = customer.id
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripe_price_id,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes/assinatura?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes/assinatura?canceled=true`,
            metadata: {
                church_id: churchId,
                plan_id: planId,
            },
            subscription_data: {
                metadata: {
                    church_id: churchId,
                    plan_id: planId,
                },
            },
        })

        return {
            success: true,
            sessionId: session.id,
            url: session.url,
        }
    } catch (error) {
        console.error('[createCheckoutSession] Stripe error:', error)
        return { error: 'Erro ao criar sessão de pagamento' }
    }
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession(churchId: string) {
    const supabase = await createClient()

    // Get church's Stripe customer ID
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!subscription?.stripe_customer_id) {
        return { error: 'Nenhuma assinatura encontrada' }
    }

    try {
        // Create billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes/assinatura`,
        })

        return {
            success: true,
            url: session.url,
        }
    } catch (error) {
        console.error('[createPortalSession] Stripe error:', error)
        return { error: 'Erro ao criar portal de cobrança' }
    }
}

/**
 * Get subscription plans
 */
export async function getSubscriptionPlans() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true })

    if (error) {
        console.error('[getSubscriptionPlans] Error:', error)
        return []
    }

    return data
}
