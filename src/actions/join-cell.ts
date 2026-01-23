'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

// Public: List cells for users to choose
export async function getAvailableCells(churchId: string) {
    const supabase = await createClient()

    const { data: cells, error } = await supabase
        .from('cells')
        .select(`
            id, 
            name, 
            day_of_week, 
            meeting_time, 
            neighborhood,
            address,
            leader:profiles!leader_id(full_name)
        `)
        .eq('church_id', churchId)
        .eq('status', 'ACTIVE')
        .order('name')

    if (error) {
        console.error('Error fetching cells:', error)
        return []
    }

    return cells
}

// User: Request to join a cell
export async function requestCellJoin(cellId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    // Check if pending request exists
    const { data: existing } = await supabase
        .from('cell_requests')
        .select('id, status')
        .eq('profile_id', profile.id)
        .eq('cell_id', cellId)
        .eq('status', 'PENDING')
        .maybeSingle()

    if (existing) throw new Error('Você já tem uma solicitação pendente para esta célula.')

    const { error } = await supabase
        .from('cell_requests')
        .insert({
            church_id: profile.church_id,
            cell_id: cellId,
            profile_id: profile.id,
            status: 'PENDING'
        })

    if (error) throw new Error('Erro ao enviar solicitação.')

    return { success: true }
}

// Leader: Get pending requests
export async function getCellRequests() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    // RLS will ensure they only see requests for their cell (or if they are pastor)
    const { data: requests, error } = await supabase
        .from('cell_requests')
        .select(`
            id,
            created_at,
            status,
            profile:profiles!profile_id(
                id,
                full_name,
                photo_url,
                phone
            ),
            cell:cells(name)
        `)
        .eq('status', 'PENDING')
        .eq('church_id', profile.church_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching requests:', error)
        return []
    }

    return requests
}

// Leader: Approve Request
export async function approveCellRequest(requestId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    // Get the request to find user and cell
    const { data: request } = await supabase
        .from('cell_requests')
        .select('profile_id, cell_id')
        .eq('id', requestId)
        .single()

    if (!request) throw new Error('Solicitação não encontrada')

    // 1. Update request status
    const { error: updateError } = await supabase
        .from('cell_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId)

    if (updateError) throw new Error('Erro ao aprovar solicitação')

    // 2. Update user profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            cell_id: request.cell_id,
            member_stage: 'MEMBER' // Or VISITOR? Let's default to MEMBER for now as they requested to join
        })
        .eq('id', request.profile_id)

    if (profileError) throw new Error('Erro ao atualizar perfil do membro')

    revalidatePath('/minha-celula/solicitacoes')
    return { success: true }
}

// Leader: Reject Request
export async function rejectCellRequest(requestId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    const { error } = await supabase
        .from('cell_requests')
        .update({ status: 'REJECTED' })
        .eq('id', requestId)

    if (error) throw new Error('Erro ao rejeitar solicitação')

    revalidatePath('/minha-celula/solicitacoes')
    return { success: true }
}
