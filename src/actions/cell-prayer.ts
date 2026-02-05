'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export interface CellPrayerRequest {
    id: string
    cell_id: string
    author_id: string
    church_id: string
    request: string
    is_anonymous: boolean
    status: 'active' | 'answered' | 'archived'
    testimony: string | null
    created_at: string
    updated_at: string
    author: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
    supporters_count: number
    user_is_supporting: boolean
}

export async function getCellPrayerRequests(cellId: string): Promise<{ success: boolean; data?: CellPrayerRequest[]; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Get prayer requests with author info
        const { data: requests, error } = await supabase
            .from('cell_prayer_requests')
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url)
            `)
            .eq('cell_id', cellId)
            .eq('church_id', profile.church_id)
            .in('status', ['active', 'answered'])
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getCellPrayerRequests] Error:', error)
            return { success: false, error: error.message }
        }

        // Get all supporters in a single query for efficiency
        const requestIds = (requests || []).map(r => r.id)
        
        const { data: allSupporters } = await supabase
            .from('cell_prayer_supporters')
            .select('prayer_request_id, supporter_id')
            .in('prayer_request_id', requestIds)

        // Count supporters and check user support for each request
        const supportersByRequest = new Map<string, { count: number; userSupporting: boolean }>()
        
        for (const requestId of requestIds) {
            const supporters = (allSupporters || []).filter(s => s.prayer_request_id === requestId)
            supportersByRequest.set(requestId, {
                count: supporters.length,
                userSupporting: supporters.some(s => s.supporter_id === profile.id)
            })
        }

        const requestsWithSupport = (requests || []).map(request => {
            const supportInfo = supportersByRequest.get(request.id) || { count: 0, userSupporting: false }
            return {
                ...request,
                author: Array.isArray(request.author) ? request.author[0] : request.author,
                supporters_count: supportInfo.count,
                user_is_supporting: supportInfo.userSupporting
            }
        })

        return { success: true, data: requestsWithSupport }
    } catch (error) {
        console.error('[getCellPrayerRequests] Error:', error)
        return { success: false, error: 'Erro ao buscar pedidos de oração' }
    }
}

export async function createPrayerRequest(
    cellId: string,
    request: string,
    isAnonymous: boolean = false
): Promise<{ success: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('cell_prayer_requests')
            .insert({
                cell_id: cellId,
                author_id: profile.id,
                church_id: profile.church_id,
                request,
                is_anonymous: isAnonymous
            })

        if (error) {
            console.error('[createPrayerRequest] Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/membro/minha-celula')
        return { success: true }
    } catch (error) {
        console.error('[createPrayerRequest] Error:', error)
        return { success: false, error: 'Erro ao criar pedido de oração' }
    }
}

export async function togglePrayerSupport(
    prayerRequestId: string
): Promise<{ success: boolean; isSupporting?: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Check if already supporting
        const { data: existingSupport } = await supabase
            .from('cell_prayer_supporters')
            .select('id')
            .eq('prayer_request_id', prayerRequestId)
            .eq('supporter_id', profile.id)
            .maybeSingle()

        if (existingSupport) {
            // Remove support
            const { error } = await supabase
                .from('cell_prayer_supporters')
                .delete()
                .eq('id', existingSupport.id)

            if (error) {
                return { success: false, error: error.message }
            }

            revalidatePath('/membro/minha-celula')
            return { success: true, isSupporting: false }
        } else {
            // Add support
            const { error } = await supabase
                .from('cell_prayer_supporters')
                .insert({
                    prayer_request_id: prayerRequestId,
                    supporter_id: profile.id
                })

            if (error) {
                return { success: false, error: error.message }
            }

            revalidatePath('/membro/minha-celula')
            return { success: true, isSupporting: true }
        }
    } catch (error) {
        console.error('[togglePrayerSupport] Error:', error)
        return { success: false, error: 'Erro ao atualizar apoio' }
    }
}

export async function markPrayerAsAnswered(
    prayerRequestId: string,
    testimony?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('cell_prayer_requests')
            .update({
                status: 'answered',
                testimony: testimony || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', prayerRequestId)
            .eq('author_id', profile.id)

        if (error) {
            console.error('[markPrayerAsAnswered] Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/membro/minha-celula')
        return { success: true }
    } catch (error) {
        console.error('[markPrayerAsAnswered] Error:', error)
        return { success: false, error: 'Erro ao marcar como respondida' }
    }
}

export async function deletePrayerRequest(
    prayerRequestId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('cell_prayer_requests')
            .delete()
            .eq('id', prayerRequestId)
            .eq('author_id', profile.id)

        if (error) {
            console.error('[deletePrayerRequest] Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/membro/minha-celula')
        return { success: true }
    } catch (error) {
        console.error('[deletePrayerRequest] Error:', error)
        return { success: false, error: 'Erro ao excluir pedido' }
    }
}
