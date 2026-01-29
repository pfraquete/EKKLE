'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const addMemberSchema = z.object({
    profile_id: z.string().uuid(),
})

// =====================================================
// GET FINANCE TEAM MEMBERS
// =====================================================

export async function getFinanceTeam() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Only pastors can view full finance team
    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('finance_team')
        .select(`
            *,
            member:profiles!finance_team_profile_id_fkey(id, full_name, email, photo_url),
            added_by_profile:profiles!finance_team_added_by_fkey(full_name)
        `)
        .eq('church_id', profile.church_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching finance team:', error)
        return { success: false, error: 'Erro ao buscar equipe' }
    }

    return { success: true, data: data || [] }
}

// =====================================================
// ADD MEMBER TO FINANCE TEAM
// =====================================================

export async function addToFinanceTeam(profileId: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Only pastors can add members
    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    // Verify the member belongs to the same church
    const { data: member } = await supabase
        .from('profiles')
        .select('id, church_id')
        .eq('id', profileId)
        .single()

    if (!member) {
        return { success: false, error: 'Membro não encontrado' }
    }

    if (member.church_id !== profile.church_id) {
        return { success: false, error: 'Membro não pertence a esta igreja' }
    }

    // Check if already in team
    const { data: existing } = await supabase
        .from('finance_team')
        .select('id')
        .eq('profile_id', profileId)
        .eq('church_id', profile.church_id)
        .single()

    if (existing) {
        return { success: false, error: 'Membro já faz parte da equipe' }
    }

    // Add to finance team
    const { error } = await supabase
        .from('finance_team')
        .insert({
            church_id: profile.church_id,
            profile_id: profileId,
            added_by: profile.id,
        })

    if (error) {
        console.error('Error adding to finance team:', error)
        return { success: false, error: 'Erro ao adicionar membro' }
    }

    revalidatePath('/dashboard/financeiro/equipe')
    return { success: true }
}

// =====================================================
// REMOVE MEMBER FROM FINANCE TEAM
// =====================================================

export async function removeFromFinanceTeam(profileId: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Only pastors can remove members
    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('finance_team')
        .delete()
        .eq('profile_id', profileId)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error removing from finance team:', error)
        return { success: false, error: 'Erro ao remover membro' }
    }

    revalidatePath('/dashboard/financeiro/equipe')
    return { success: true }
}

// =====================================================
// GET MEMBERS NOT IN FINANCE TEAM (for adding)
// =====================================================

export async function getMembersNotInFinanceTeam(search?: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Only pastors can view
    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    // Get all profiles not in finance team
    let query = supabase
        .from('profiles')
        .select('id, full_name, email, photo_url')
        .eq('church_id', profile.church_id)
        .eq('is_active', true)
        .not('id', 'in', `(SELECT profile_id FROM finance_team WHERE church_id = '${profile.church_id}')`)
        .order('full_name')
        .limit(20)

    if (search) {
        query = query.ilike('full_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching members:', error)
        return { success: false, error: 'Erro ao buscar membros' }
    }

    return { success: true, data: data || [] }
}

// =====================================================
// CHECK IF USER IS IN FINANCE TEAM
// =====================================================

export async function isInFinanceTeam() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, isInTeam: false }
    }

    // Pastors always have access
    if (profile.role === 'PASTOR') {
        return { success: true, isInTeam: true }
    }

    const supabase = await createClient()

    const { data } = await supabase
        .from('finance_team')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('church_id', profile.church_id)
        .single()

    return { success: true, isInTeam: !!data }
}
