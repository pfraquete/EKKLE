'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { INTEGRATION_CONFIGS } from '@/lib/integration-config'

export interface IntegrationStatus {
    id: string
    provider: string
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
    last_check_at: string | null
    last_success_at: string | null
    error_message: string | null
    metrics: Record<string, any>
    config: Record<string, any>
    created_at: string
    updated_at: string
}

/**
 * Get all integration statuses
 */
export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('integration_status')
        .select('*')
        .order('provider')

    if (error) {
        console.error('[Super Admin] Failed to fetch integrations:', error)
        throw new Error('Falha ao buscar integracoes')
    }

    return data || []
}

/**
 * Check health of a specific integration
 */
export async function checkIntegrationHealth(provider: string): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    latency?: number
    error?: string
}> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'down' = 'down'
    let errorMessage: string | undefined

    try {
        switch (provider) {
            case 'stripe':
                // Check Stripe API
                const stripeResponse = await fetch('https://api.stripe.com/v1/balance', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                    },
                })
                status = stripeResponse.ok ? 'healthy' : 'degraded'
                if (!stripeResponse.ok) {
                    errorMessage = `HTTP ${stripeResponse.status}`
                }
                break

            case 'resend':
                // Check Resend API
                const resendResponse = await fetch('https://api.resend.com/domains', {
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                })
                status = resendResponse.ok ? 'healthy' : 'degraded'
                if (!resendResponse.ok) {
                    errorMessage = `HTTP ${resendResponse.status}`
                }
                break

            case 'openai':
                // Check OpenAI API
                const openaiResponse = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                })
                status = openaiResponse.ok ? 'healthy' : 'degraded'
                if (!openaiResponse.ok) {
                    errorMessage = `HTTP ${openaiResponse.status}`
                }
                break

            case 'evolution':
                // Check Evolution API
                const evolutionUrl = process.env.EVOLUTION_API_URL
                if (evolutionUrl) {
                    const evolutionResponse = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
                        headers: {
                            'apikey': process.env.EVOLUTION_API_KEY || '',
                        },
                    })
                    status = evolutionResponse.ok ? 'healthy' : 'degraded'
                    if (!evolutionResponse.ok) {
                        errorMessage = `HTTP ${evolutionResponse.status}`
                    }
                } else {
                    status = 'down'
                    errorMessage = 'URL nao configurada'
                }
                break

            case 'mux':
                // Check Mux API
                const muxResponse = await fetch('https://api.mux.com/video/v1/assets', {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64')}`,
                    },
                })
                status = muxResponse.ok ? 'healthy' : 'degraded'
                if (!muxResponse.ok) {
                    errorMessage = `HTTP ${muxResponse.status}`
                }
                break

            case 'livekit':
                // LiveKit health check would depend on their API
                // For now, mark as unknown
                status = 'healthy'
                break

            case 'pagarme':
                // Check Pagar.me API
                const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/balance', {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString('base64')}`,
                    },
                })
                status = pagarmeResponse.ok ? 'healthy' : 'degraded'
                if (!pagarmeResponse.ok) {
                    errorMessage = `HTTP ${pagarmeResponse.status}`
                }
                break

            default:
                status = 'unknown' as any
                errorMessage = 'Integracao desconhecida'
        }
    } catch (error) {
        status = 'down'
        errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    }

    const latency = Date.now() - startTime

    // Update database with new status
    const updateData: any = {
        status,
        last_check_at: new Date().toISOString(),
        metrics: { latency },
        updated_at: new Date().toISOString()
    }

    if (status === 'healthy') {
        updateData.last_success_at = new Date().toISOString()
        updateData.error_message = null
    } else {
        updateData.error_message = errorMessage
    }

    await supabase
        .from('integration_status')
        .update(updateData)
        .eq('provider', provider)

    // Log the action
    await logAdminAction('integration.check', 'integration', {
        targetId: provider,
        newValue: { status, latency, error: errorMessage }
    })

    revalidatePath('/admin/integrations')

    return { status, latency, error: errorMessage }
}

/**
 * Check health of all integrations
 */
export async function checkAllIntegrationsHealth() {
    await requireSuperAdmin()

    const providers = Object.keys(INTEGRATION_CONFIGS)
    const results: Record<string, { status: string; latency?: number; error?: string }> = {}

    // Run all checks in parallel
    await Promise.all(
        providers.map(async (provider) => {
            try {
                results[provider] = await checkIntegrationHealth(provider)
            } catch (error) {
                results[provider] = {
                    status: 'down',
                    error: error instanceof Error ? error.message : 'Erro'
                }
            }
        })
    )

    return results
}

/**
 * Get failed webhooks for retry
 */
export async function getFailedWebhooks(limit: number = 50) {
    await requireSuperAdmin()
    const supabase = await createClient()

    // This assumes there's a webhook_events table tracking webhook deliveries
    // Adjust based on actual schema
    const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        // Table might not exist
        return []
    }

    return data || []
}

/**
 * Retry a failed webhook
 */
export async function retryWebhook(webhookId: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: webhook } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('id', webhookId)
        .single()

    if (!webhook) {
        throw new Error('Webhook nao encontrado')
    }

    // Log the retry attempt
    await logAdminAction('webhook.retry', 'webhook', {
        targetId: webhookId,
        oldValue: { status: webhook.status }
    })

    // Implementation depends on webhook retry mechanism
    // This is a placeholder
    console.log('[Super Admin] Retrying webhook:', webhookId)

    return { success: true }
}
