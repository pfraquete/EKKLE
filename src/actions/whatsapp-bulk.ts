'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { EvolutionService, ANTI_BAN_CONFIG } from '@/lib/evolution'
import { getWhatsAppInstance } from './whatsapp'

export interface MessagingTarget {
    id: string
    full_name: string
    phone: string
    role: string
    member_stage: string
}

export interface BulkMessageResult {
    total: number
    sent: number
    failed: number
    errors: { name: string; error: string }[]
    estimatedTime?: string
}

/**
 * Gets potential messaging targets based on filters
 */
export async function getMessagingTargets(filters: {
    role?: string
    member_stage?: string
    search?: string
}) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            throw new Error('Não autorizado')
        }

        const supabase = await createClient()
        let query = supabase
            .from('profiles')
            .select('id, full_name, phone, role, member_stage')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .not('phone', 'is', null)

        if (filters.role) {
            query = query.eq('role', filters.role)
        }

        if (filters.member_stage) {
            query = query.eq('member_stage', filters.member_stage)
        }

        if (filters.search) {
            query = query.ilike('full_name', `%${filters.search}%`)
        }

        const { data, error } = await query.order('full_name')

        if (error) throw error

        return { success: true, data: data as MessagingTarget[] }
    } catch (error: any) {
        console.error('Error fetching messaging targets:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Calcula o tempo estimado para envio em massa
 */
export async function calculateEstimatedTime(targetCount: number): Promise<string> {
    // Tempo médio por mensagem (digitação + delay entre mensagens)
    const avgTimePerMessage = 
        (ANTI_BAN_CONFIG.MIN_TYPING_DELAY + ANTI_BAN_CONFIG.MAX_TYPING_DELAY) / 2 +
        (ANTI_BAN_CONFIG.MIN_BULK_DELAY + ANTI_BAN_CONFIG.MAX_BULK_DELAY) / 2

    // Pausas adicionais a cada 50 mensagens
    const pauseCount = Math.floor(targetCount / ANTI_BAN_CONFIG.BULK_PAUSE_AFTER)
    const totalPauseTime = pauseCount * ANTI_BAN_CONFIG.BULK_PAUSE_DURATION

    // Tempo total em ms
    const totalTime = (targetCount * avgTimePerMessage) + totalPauseTime

    // Converter para formato legível
    const minutes = Math.ceil(totalTime / 60000)
    if (minutes < 60) {
        return `~${minutes} minutos`
    } else {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `~${hours}h ${remainingMinutes}min`
    }
}

/**
 * Sends messages in bulk with anti-ban protection
 * 
 * SISTEMA ANTI-BANIMENTO:
 * - Simulação de digitação antes de cada mensagem
 * - Delays aleatórios entre mensagens (3-8 segundos)
 * - Pausas longas a cada 50 mensagens (1 minuto)
 * - Rate limiting de 200 mensagens por hora
 */
export async function sendBulkWhatsAppMessage(
    messageTemplate: string,
    targets: MessagingTarget[]
): Promise<{ success: boolean; results?: BulkMessageResult; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            throw new Error('Não autorizado')
        }

        const { data: instance } = await getWhatsAppInstance()
        if (!instance || instance.status !== 'CONNECTED') {
            throw new Error('WhatsApp não conectado. Vá em Configurações para conectar.')
        }

        // Verificar limite de mensagens por hora
        if (targets.length > ANTI_BAN_CONFIG.MAX_BULK_MESSAGES_PER_HOUR) {
            throw new Error(
                `Limite de ${ANTI_BAN_CONFIG.MAX_BULK_MESSAGES_PER_HOUR} mensagens por hora. ` +
                `Você selecionou ${targets.length} destinatários. ` +
                `Por favor, reduza a quantidade ou divida em lotes.`
            )
        }

        console.log(`[Bulk Message] Starting bulk send to ${targets.length} targets`)
        console.log(`[Bulk Message] Estimated time: ${await calculateEstimatedTime(targets.length)}`)

        // Preparar mensagens com placeholders substituídos
        const messages = targets.map(target => ({
            to: target.phone,
            text: messageTemplate.replace(/\{\{nome\}\}/gi, target.full_name.split(' ')[0]),
            name: target.full_name,
        }))

        // Usar o sistema de envio em massa com anti-banimento
        const bulkResult = await EvolutionService.sendBulkMessages(
            instance.instance_name,
            messages.map(m => ({ to: m.to, text: m.text })),
            {
                onProgress: (sent, total, current) => {
                    console.log(`[Bulk Message] Progress: ${sent}/${total}`)
                },
                onError: (error, message) => {
                    console.error(`[Bulk Message] Error sending to ${message.to}:`, error.message)
                },
            }
        )

        // Mapear erros com nomes
        const errorsWithNames = bulkResult.errors.map((err, index) => {
            const target = targets.find(t => t.phone === err.to)
            return {
                name: target?.full_name || err.to,
                error: err.error,
            }
        })

        const results: BulkMessageResult = {
            total: targets.length,
            sent: bulkResult.sent,
            failed: bulkResult.failed,
            errors: errorsWithNames,
            estimatedTime: await calculateEstimatedTime(targets.length),
        }

        console.log(`[Bulk Message] Completed. Sent: ${results.sent}, Failed: ${results.failed}`)

        return { success: true, results }
    } catch (error: any) {
        console.error('Error in bulk messaging:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Envia mensagem para um único destinatário com anti-banimento
 */
export async function sendSingleWhatsAppMessage(
    phone: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            throw new Error('Não autorizado')
        }

        const { data: instance } = await getWhatsAppInstance()
        if (!instance || instance.status !== 'CONNECTED') {
            throw new Error('WhatsApp não conectado. Vá em Configurações para conectar.')
        }

        await EvolutionService.sendTextWithTyping(instance.instance_name, phone, message)

        return { success: true }
    } catch (error: any) {
        console.error('Error sending single message:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Retorna o status da fila de mensagens
 */
export async function getMessageQueueStatus(): Promise<{
    pending: number
    processing: number
    total: number
}> {
    const status = EvolutionService.getQueueStatus()
    return status
}

/**
 * Limpa a fila de mensagens (use com cuidado)
 */
export async function clearMessageQueue(): Promise<{ success: boolean }> {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            throw new Error('Não autorizado')
        }

        EvolutionService.clearQueue()
        return { success: true }
    } catch (error: any) {
        console.error('Error clearing queue:', error)
        return { success: false }
    }
}
