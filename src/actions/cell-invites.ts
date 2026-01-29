'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export interface CellInviteLink {
    id: string
    church_id: string
    cell_id: string
    created_by: string
    token: string
    expires_at: string
    max_uses: number | null
    use_count: number
    is_active: boolean
    created_at: string
}

export interface InviteValidationResult {
    valid: boolean
    error?: string
    cell?: {
        id: string
        name: string
        neighborhood: string | null
        day_of_week: number | null
        meeting_time: string | null
        leader_name: string | null
    }
    church?: {
        id: string
        name: string
        slug: string
        logo_url: string | null
    }
    invite?: CellInviteLink
}

/**
 * Generate a secure random token for invite links
 */
function generateToken(): string {
    return crypto.randomBytes(16).toString('base64url')
}

/**
 * Create a new cell invite link
 * Only cell leaders can create links for their cell
 */
export async function createCellInviteLink(
    cellId: string,
    expiresInHours: number,
    maxUses?: number
): Promise<{ success: boolean; link?: CellInviteLink; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Verify user is leader of this cell or pastor
        const { data: cell, error: cellError } = await supabase
            .from('cells')
            .select('id, church_id, leader_id')
            .eq('id', cellId)
            .single()

        if (cellError || !cell) {
            return { success: false, error: 'Célula não encontrada' }
        }

        const isLeader = cell.leader_id === profile.id
        const isPastor = profile.role === 'PASTOR' && profile.church_id === cell.church_id

        if (!isLeader && !isPastor) {
            return { success: false, error: 'Você não tem permissão para criar links de convite para esta célula' }
        }

        // Generate unique token
        const token = generateToken()

        // Calculate expiration date
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expiresInHours)

        // Create the invite link
        const { data: inviteLink, error: insertError } = await supabase
            .from('cell_invite_links')
            .insert({
                church_id: cell.church_id,
                cell_id: cellId,
                created_by: profile.id,
                token,
                expires_at: expiresAt.toISOString(),
                max_uses: maxUses || null,
                use_count: 0,
                is_active: true
            })
            .select()
            .single()

        if (insertError) {
            console.error('[createCellInviteLink] Error:', insertError)
            return { success: false, error: 'Erro ao criar link de convite' }
        }

        revalidatePath('/minha-celula')

        return { success: true, link: inviteLink }
    } catch (error) {
        console.error('[createCellInviteLink] Error:', error)
        return { success: false, error: 'Erro interno ao criar link de convite' }
    }
}

/**
 * Get all invite links for a cell
 * Only cell leader or pastor can view
 */
export async function getCellInviteLinks(cellId: string): Promise<CellInviteLink[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        const { data: links, error } = await supabase
            .from('cell_invite_links')
            .select('*')
            .eq('cell_id', cellId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getCellInviteLinks] Error:', error)
            return []
        }

        return links || []
    } catch (error) {
        console.error('[getCellInviteLinks] Error:', error)
        return []
    }
}

/**
 * Deactivate an invite link
 */
export async function deactivateInviteLink(linkId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('cell_invite_links')
            .update({ is_active: false })
            .eq('id', linkId)

        if (error) {
            console.error('[deactivateInviteLink] Error:', error)
            return { success: false, error: 'Erro ao desativar link' }
        }

        revalidatePath('/minha-celula')

        return { success: true }
    } catch (error) {
        console.error('[deactivateInviteLink] Error:', error)
        return { success: false, error: 'Erro interno ao desativar link' }
    }
}

/**
 * Validate an invite token (public function for registration page)
 * Returns cell and church info if valid
 */
export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
    try {
        const supabase = await createClient()

        // Get the invite link first
        const { data: invite, error } = await supabase
            .from('cell_invite_links')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !invite) {
            console.error('[validateInviteToken] Invite not found:', error)
            return { valid: false, error: 'Link de convite inválido ou não encontrado' }
        }

        // Check if link is active
        if (!invite.is_active) {
            return { valid: false, error: 'Este link de convite foi desativado' }
        }

        // Check if link has expired
        if (new Date(invite.expires_at) < new Date()) {
            return { valid: false, error: 'Este link de convite expirou' }
        }

        // Check if max uses exceeded
        if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
            return { valid: false, error: 'Este link de convite atingiu o limite de usos' }
        }

        // Get cell info separately
        const { data: cell, error: cellError } = await supabase
            .from('cells')
            .select('id, name, neighborhood, day_of_week, meeting_time, leader_id')
            .eq('id', invite.cell_id)
            .single()

        if (cellError || !cell) {
            console.error('[validateInviteToken] Cell not found:', cellError)
            return { valid: false, error: 'Célula não encontrada' }
        }

        // Get leader name
        let leaderName: string | null = null
        if (cell.leader_id) {
            const { data: leader } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', cell.leader_id)
                .single()
            leaderName = leader?.full_name || null
        }

        // Get church info
        const { data: church, error: churchError } = await supabase
            .from('churches')
            .select('id, name, slug, logo_url')
            .eq('id', invite.church_id)
            .single()

        if (churchError || !church) {
            console.error('[validateInviteToken] Church not found:', churchError)
            return { valid: false, error: 'Igreja não encontrada' }
        }

        return {
            valid: true,
            cell: {
                id: cell.id,
                name: cell.name,
                neighborhood: cell.neighborhood,
                day_of_week: cell.day_of_week,
                meeting_time: cell.meeting_time,
                leader_name: leaderName
            },
            church: {
                id: church.id,
                name: church.name,
                slug: church.slug,
                logo_url: church.logo_url
            },
            invite: {
                id: invite.id,
                church_id: invite.church_id,
                cell_id: invite.cell_id,
                created_by: invite.created_by,
                token: invite.token,
                expires_at: invite.expires_at,
                max_uses: invite.max_uses,
                use_count: invite.use_count,
                is_active: invite.is_active,
                created_at: invite.created_at
            }
        }
    } catch (error) {
        console.error('[validateInviteToken] Error:', error)
        return { valid: false, error: 'Erro ao validar link de convite' }
    }
}

/**
 * Increment the usage count of an invite link
 * Called after successful registration via invite
 */
export async function incrementInviteUsage(token: string): Promise<{ success: boolean }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('increment_invite_usage', { invite_token: token })

        // If RPC doesn't exist, use direct update
        if (error && error.message.includes('function')) {
            const { error: updateError } = await supabase
                .from('cell_invite_links')
                .update({ use_count: supabase.rpc('increment', { x: 1 }) })
                .eq('token', token)

            // Fallback: manual increment
            if (updateError) {
                const { data: current } = await supabase
                    .from('cell_invite_links')
                    .select('use_count')
                    .eq('token', token)
                    .single()

                if (current) {
                    await supabase
                        .from('cell_invite_links')
                        .update({ use_count: current.use_count + 1 })
                        .eq('token', token)
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('[incrementInviteUsage] Error:', error)
        return { success: false }
    }
}
