'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

// Admin client for bypassing RLS on profile updates
const getAdminClient = () => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * Request to join a cell
 */
export async function requestCellMembership(cellId: string, message?: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Check if user is already in a cell
    if (profile.cell_id) {
        return { success: false, error: 'Você já participa de uma célula' }
    }

    // Check if cell exists and is active
    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .select('id, name, status, church_id, leader_id')
        .eq('id', cellId)
        .single()

    if (cellError || !cell) {
        return { success: false, error: 'Célula não encontrada' }
    }

    if (cell.status !== 'ACTIVE') {
        return { success: false, error: 'Esta célula não está ativa no momento' }
    }

    // Verify user belongs to the same church as the cell
    if (cell.church_id !== profile.church_id) {
        return { success: false, error: 'Você não pode solicitar participação em células de outra igreja' }
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
        .from('cell_requests')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('cell_id', cellId)
        .eq('status', 'PENDING')
        .single()

    if (existingRequest) {
        return { success: false, error: 'Você já possui uma solicitação pendente para esta célula' }
    }

    // Create cell request
    const { error: insertError } = await supabase
        .from('cell_requests')
        .insert({
            church_id: profile.church_id,
            cell_id: cellId,
            profile_id: profile.id,
            status: 'PENDING',
            message: message || null,
        })

    if (insertError) {
        console.error('Error creating cell request:', insertError)
        return { success: false, error: 'Erro ao criar solicitação' }
    }

    // Send notification to cell leader
    const { data: leader } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', cell.leader_id)
        .single()

    if (leader) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app'
        const requestsUrl = `${appUrl}/minha-celula/solicitacoes`

        const { sendCellRequestNotification } = await import('@/lib/email')
        await sendCellRequestNotification({
            to: leader.email,
            leaderName: leader.full_name,
            memberName: profile.full_name,
            cellName: cell.name,
            message: message,
            requestsUrl
        })
    }

    revalidatePath('/celulas')
    revalidatePath(`/celulas/${cellId}`)

    return { success: true }
}

/**
 * Cancel a pending cell request
 */
export async function cancelCellRequest(requestId: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Verify request belongs to user and is pending
    const { data: request } = await supabase
        .from('cell_requests')
        .select('id, status, profile_id')
        .eq('id', requestId)
        .single()

    if (!request) {
        return { success: false, error: 'Solicitação não encontrada' }
    }

    if (request.profile_id !== profile.id) {
        return { success: false, error: 'Você não tem permissão para cancelar esta solicitação' }
    }

    if (request.status !== 'PENDING') {
        return { success: false, error: 'Apenas solicitações pendentes podem ser canceladas' }
    }

    // Delete the request
    const { error } = await supabase
        .from('cell_requests')
        .delete()
        .eq('id', requestId)

    if (error) {
        console.error('Error canceling cell request:', error)
        return { success: false, error: 'Erro ao cancelar solicitação' }
    }

    revalidatePath('/celulas')

    return { success: true }
}

/**
 * Get user's pending cell requests
 */
export async function getMyCellRequests() {
    const profile = await getProfile()
    if (!profile) {
        return { data: null, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_requests')
        .select(`
            id,
            status,
            message,
            created_at,
            reviewed_at,
            rejection_reason,
            cell:cells (
                id,
                name,
                leader:profiles!cells_leader_fk (
                    full_name
                )
            )
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

    return { data, error }
}

/**
 * Approve a cell request (for cell leaders and pastors)
 * Optionally link the new member to an existing non-real profile
 */
export async function approveCellRequest(requestId: string, linkToProfileId?: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()
    const adminClient = getAdminClient()

    // Get request details
    const { data: request, error: requestError } = await supabase
        .from('cell_requests')
        .select(`
            id,
            status,
            profile_id,
            cell_id,
            church_id,
            cell:cells (
                id,
                name,
                leader_id,
                church_id
            )
        `)
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        return { success: false, error: 'Solicitação não encontrada' }
    }

    if (request.status !== 'PENDING') {
        return { success: false, error: 'Esta solicitação já foi processada' }
    }

    // Handle Supabase array format
    const cell = Array.isArray(request.cell) ? request.cell[0] : request.cell

    // Verify permission: must be cell leader or pastor
    const isLeader = cell.leader_id === profile.id
    const isPastor = profile.role === 'PASTOR' && profile.church_id === request.church_id

    if (!isLeader && !isPastor) {
        return { success: false, error: 'Você não tem permissão para aprovar esta solicitação' }
    }

    // Check if member is already in another cell
    const { data: memberProfile } = await adminClient
        .from('profiles')
        .select('cell_id')
        .eq('id', request.profile_id)
        .single()

    if (memberProfile?.cell_id) {
        return { success: false, error: 'Este membro já participa de outra célula' }
    }

    // Update request status using admin client
    const { error: updateRequestError } = await adminClient
        .from('cell_requests')
        .update({
            status: 'APPROVED',
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

    if (updateRequestError) {
        console.error('Error updating request:', updateRequestError)
        return { success: false, error: 'Erro ao aprovar solicitação' }
    }

    // Update member's profile to add them to the cell using admin client
    const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update({
            cell_id: request.cell_id,
            member_stage: 'MEMBER',
        })
        .eq('id', request.profile_id)

    if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError)
        // Rollback request status
        await adminClient
            .from('cell_requests')
            .update({ status: 'PENDING', reviewed_by: null, reviewed_at: null })
            .eq('id', requestId)
        return { success: false, error: 'Erro ao adicionar membro à célula' }
    }

    // If linking to a non-real profile, transfer attendance history and deactivate it
    if (linkToProfileId) {
        try {
            // Transfer attendance records from non-real profile to real member
            await adminClient
                .from('attendance')
                .update({ profile_id: request.profile_id })
                .eq('profile_id', linkToProfileId)

            // Deactivate the non-real profile
            await adminClient
                .from('profiles')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', linkToProfileId)
        } catch (linkError) {
            console.error('Error linking profiles:', linkError)
            // Don't fail the approval if linking fails
        }
    }

    // Send notification to member
    const { data: member } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', request.profile_id)
        .single()

    if (member) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app'
        const cellUrl = `${appUrl}/minha-celula`

        try {
            const { sendCellApprovalNotification } = await import('@/lib/email')
            await sendCellApprovalNotification({
                to: member.email,
                memberName: member.full_name,
                cellName: cell.name,
                cellUrl
            })
        } catch (emailError) {
            console.error('Error sending approval notification:', emailError)
        }
    }

    revalidatePath('/minha-celula')
    revalidatePath('/minha-celula/solicitacoes')
    revalidatePath('/membro/minha-celula/membros')
    revalidatePath('/celulas')

    return { success: true }
}

/**
 * Reject a cell request (for cell leaders and pastors)
 */
export async function rejectCellRequest(requestId: string, reason?: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get request details
    const { data: request, error: requestError } = await supabase
        .from('cell_requests')
        .select(`
            id,
            status,
            profile_id,
            cell_id,
            church_id,
            cell:cells (
                id,
                name,
                leader_id,
                church_id
            )
        `)
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        return { success: false, error: 'Solicitação não encontrada' }
    }

    if (request.status !== 'PENDING') {
        return { success: false, error: 'Esta solicitação já foi processada' }
    }

    // Handle Supabase array format
    const cell = Array.isArray(request.cell) ? request.cell[0] : request.cell

    // Verify permission: must be cell leader or pastor
    const isLeader = cell.leader_id === profile.id
    const isPastor = profile.role === 'PASTOR' && profile.church_id === request.church_id

    if (!isLeader && !isPastor) {
        return { success: false, error: 'Você não tem permissão para rejeitar esta solicitação' }
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('cell_requests')
        .update({
            status: 'REJECTED',
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason || null,
        })
        .eq('id', requestId)

    if (updateError) {
        console.error('Error rejecting request:', updateError)
        return { success: false, error: 'Erro ao rejeitar solicitação' }
    }

    // Send notification to member
    const { data: member } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', request.profile_id)
        .single()

    if (member) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app'
        const cellsUrl = `${appUrl}/celulas`

        const { sendCellRejectionNotification } = await import('@/lib/email')
        await sendCellRejectionNotification({
            to: member.email,
            memberName: member.full_name,
            cellName: cell.name,
            reason: reason,
            cellsUrl
        })
    }

    revalidatePath('/minha-celula/solicitacoes')
    revalidatePath('/membro/minha-celula/membros')
    revalidatePath('/celulas')

    return { success: true }
}

/**
 * Get pending cell requests for a leader's cell
 */
export async function getPendingCellRequests() {
    const profile = await getProfile()
    if (!profile) {
        return { data: null, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get requests for cells where user is the leader
    const { data, error } = await supabase
        .from('cell_requests')
        .select(`
            id,
            message,
            created_at,
            cell:cells!inner (
                id,
                name,
                leader_id
            ),
            profile:profiles!cell_requests_profile_id_fkey (
                id,
                full_name,
                email,
                phone,
                photo_url
            )
        `)
        .eq('status', 'PENDING')
        .eq('cell.leader_id', profile.id)
        .order('created_at', { ascending: true })

    return { data, error }
}
