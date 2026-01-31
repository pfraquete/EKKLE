'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { EKKLE_HUB_ID, isEkkleHubUser } from '@/lib/ekkle-utils'
import slugify from 'slugify'
import crypto from 'crypto'

interface CreateChurchCheckoutInput {
    churchName: string
}

interface CreateChurchCheckoutResult {
    success?: boolean
    error?: string
    sessionId?: string
    url?: string | null
}

/**
 * Generate a unique slug for the church
 * Checks both existing churches and pending requests
 */
async function generateUniqueSlug(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, churchName: string): Promise<string> {
    const baseSlug = slugify(churchName, { lower: true, strict: true })

    for (let attempt = 0; attempt < 5; attempt++) {
        const slug = attempt === 0
            ? baseSlug
            : `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`

        // Check existing churches
        const { data: existingChurch } = await supabase
            .from('churches')
            .select('id')
            .eq('slug', slug)
            .maybeSingle()

        if (existingChurch) continue

        // Check pending requests
        const { data: pendingSlug } = await supabase
            .from('pending_church_requests')
            .select('id')
            .eq('church_slug', slug)
            .in('status', ['pending_payment', 'payment_processing'])
            .maybeSingle()

        if (!pendingSlug) return slug
    }

    // Fallback: use UUID suffix
    return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
}

/**
 * Create a Stripe checkout session for church creation
 * Only available for Ekkle Hub users (unaffiliated)
 */
export async function createChurchCheckoutSession(input: CreateChurchCheckoutInput): Promise<CreateChurchCheckoutResult> {
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // 2. Get user profile and verify they're in Ekkle Hub
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('[createChurchCheckoutSession] Profile error:', profileError)
        return { error: 'Perfil não encontrado' }
    }

    if (!isEkkleHubUser(profile)) {
        return { error: 'Apenas usuários não afiliados podem abrir uma igreja. Você já pertence a uma igreja.' }
    }

    // 3. Validate input
    const churchName = input.churchName?.trim()
    if (!churchName || churchName.length < 3) {
        return { error: 'Nome da igreja deve ter pelo menos 3 caracteres' }
    }

    if (churchName.length > 100) {
        return { error: 'Nome da igreja deve ter no máximo 100 caracteres' }
    }

    // 4. Check for existing pending request
    const { data: existingRequest } = await supabase
        .from('pending_church_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending_payment', 'payment_processing'])
        .maybeSingle()

    if (existingRequest) {
        // If there's an existing request with a checkout session, return it
        if (existingRequest.stripe_checkout_session_id) {
            try {
                const session = await stripe.checkout.sessions.retrieve(existingRequest.stripe_checkout_session_id)
                if (session.status === 'open' && session.url) {
                    return {
                        success: true,
                        sessionId: session.id,
                        url: session.url,
                    }
                }
            } catch {
                // Session expired or invalid, mark as expired and continue
                await supabase
                    .from('pending_church_requests')
                    .update({ status: 'expired' })
                    .eq('id', existingRequest.id)
            }
        } else {
            return { error: 'Você já possui uma solicitação em andamento. Aguarde ou tente novamente mais tarde.' }
        }
    }

    // 5. Generate unique slug
    const slug = await generateUniqueSlug(supabase, churchName)

    // 6. Get or create Stripe customer
    let stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
        try {
            const customer = await stripe.customers.create({
                email: profile.email || undefined,
                name: profile.full_name,
                metadata: {
                    user_id: user.id,
                    profile_id: profile.id,
                    source: 'church_creation',
                },
            })
            stripeCustomerId = customer.id

            // Update profile with Stripe customer ID
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', user.id)
        } catch (error) {
            console.error('[createChurchCheckoutSession] Stripe customer error:', error)
            return { error: 'Erro ao criar cliente de pagamento' }
        }
    }

    // 7. Get monthly plan (R$57)
    const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('interval', 'month')
        .eq('is_active', true)
        .order('price_cents', { ascending: true })
        .limit(1)
        .single()

    if (planError || !plan) {
        console.error('[createChurchCheckoutSession] Plan error:', planError)
        return { error: 'Plano de assinatura não encontrado' }
    }

    if (!plan.stripe_price_id) {
        console.error('[createChurchCheckoutSession] Missing stripe_price_id')
        return { error: 'Plano não configurado corretamente. Entre em contato com o suporte.' }
    }

    // 8. Create pending church request
    const { data: pendingRequest, error: requestError } = await supabase
        .from('pending_church_requests')
        .insert({
            user_id: user.id,
            church_name: churchName,
            church_slug: slug,
            stripe_customer_id: stripeCustomerId,
            status: 'pending_payment',
            metadata: {
                plan_id: plan.id,
                plan_name: plan.name,
                plan_price_cents: plan.price_cents,
                user_email: profile.email,
                user_name: profile.full_name,
            },
        })
        .select()
        .single()

    if (requestError || !pendingRequest) {
        console.error('[createChurchCheckoutSession] Request error:', requestError)
        return { error: 'Erro ao criar solicitação. Tente novamente.' }
    }

    // 9. Create Stripe Checkout Session
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.com.br'

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: plan.stripe_price_id,
                quantity: 1,
            }],
            success_url: `${appUrl}/ekkle/membro/igreja-criada?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/ekkle/membro/abrir-igreja?canceled=true`,
            metadata: {
                type: 'church_creation',
                pending_request_id: pendingRequest.id,
                user_id: user.id,
                church_name: churchName,
                church_slug: slug,
                plan_id: plan.id,
            },
            subscription_data: {
                metadata: {
                    type: 'church_creation',
                    pending_request_id: pendingRequest.id,
                    user_id: user.id,
                    church_name: churchName,
                    church_slug: slug,
                },
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            locale: 'pt-BR',
        })

        // 10. Update pending request with session ID
        await supabase
            .from('pending_church_requests')
            .update({ stripe_checkout_session_id: session.id })
            .eq('id', pendingRequest.id)

        return {
            success: true,
            sessionId: session.id,
            url: session.url,
        }
    } catch (error) {
        console.error('[createChurchCheckoutSession] Stripe session error:', error)

        // Rollback: delete pending request
        await supabase
            .from('pending_church_requests')
            .delete()
            .eq('id', pendingRequest.id)

        return { error: 'Erro ao criar sessão de pagamento. Tente novamente.' }
    }
}

/**
 * Get user's pending church request status
 */
export async function getPendingChurchRequest() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return null
    }

    const { data: request } = await supabase
        .from('pending_church_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending_payment', 'payment_processing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return request
}

/**
 * Cancel a pending church request
 */
export async function cancelPendingChurchRequest(requestId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
        .from('pending_church_requests')
        .update({ status: 'expired' })
        .eq('id', requestId)
        .eq('user_id', user.id)
        .eq('status', 'pending_payment')

    if (error) {
        console.error('[cancelPendingChurchRequest] Error:', error)
        return { error: 'Erro ao cancelar solicitação' }
    }

    return { success: true }
}
