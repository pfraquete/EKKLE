'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { EvolutionService } from '@/lib/evolution'
import { getWhatsAppInstance } from './whatsapp'

export interface MessagingTarget {
    id: string
    full_name: string
    phone: string
    role: string
    member_stage: string
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
 * Sends messages in bulk with placeholders
 */
export async function sendBulkWhatsAppMessage(
    messageTemplate: string,
    targets: MessagingTarget[]
) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            throw new Error('Não autorizado')
        }

        const { data: instance } = await getWhatsAppInstance()
        if (!instance || instance.status !== 'CONNECTED') {
            throw new Error('WhatsApp não conectado. Vá em Configurações para conectar.')
        }

        const results = {
            total: targets.length,
            sent: 0,
            failed: 0,
            errors: [] as { name: string; error: string }[]
        }

        // Sequential sending to avoid spam blocks and respect rate limits
        for (const target of targets) {
            try {
                // simple placeholder replacement
                const personalizedMessage = messageTemplate.replace(/\{\{nome\}\}/gi, target.full_name.split(' ')[0])

                await EvolutionService.sendText(instance.instance_name, target.phone, personalizedMessage)
                results.sent++

                // Add a small delay between sends (1-2 seconds)
                await new Promise(resolve => setTimeout(resolve, 1500))
            } catch (err: any) {
                results.failed++
                results.errors.push({ name: target.full_name, error: err.message })
            }
        }

        return { success: true, results }
    } catch (error: any) {
        console.error('Error in bulk messaging:', error)
        return { success: false, error: error.message }
    }
}
