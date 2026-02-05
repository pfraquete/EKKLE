'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface VisitorProfile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  member_stage: string
  cell_id: string | null
  cell_name?: string
  created_at: string
  has_auth_user: boolean
}



// =====================================================
// SCHEMAS
// =====================================================

const linkProfilesSchema = z.object({
  visitor_profile_id: z.string().uuid('ID do visitante inválido'),
  real_profile_id: z.string().uuid('ID do perfil real inválido'),
})

// =====================================================
// GET VISITOR PROFILES (profiles without auth user)
// =====================================================

/**
 * Get all profiles that were created by leaders (no auth.users entry)
 * These are candidates for linking to real accounts
 */
export async function getVisitorProfiles(): Promise<{
  success: boolean
  data?: VisitorProfile[]
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only leaders, discipuladores, and pastors can see visitor profiles
    if (!['LEADER', 'PASTOR'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão' }
    }

    const supabase = await createClient()

    // Get all profiles from the church
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        email,
        member_stage,
        cell_id,
        created_at,
        cell:cells!profiles_cell_id_fkey(name)
      `)
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .in('member_stage', ['VISITOR', 'REGULAR_VISITOR', 'MEMBER'])
      .order('full_name')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return { success: false, error: 'Erro ao buscar perfis' }
    }

    // Check which profiles have auth users
    const profileIds = (profiles || []).map(p => p.id)
    
    // Get auth users that match these profile IDs
    // Note: We can't directly query auth.users, so we check if email exists
    // Profiles created by leaders typically don't have email or have placeholder emails
    
    const visitorProfiles: VisitorProfile[] = (profiles || [])
      .filter(p => {
        // Consider as "visitor" (no real account) if:
        // 1. No email at all
        // 2. Email doesn't look like a real email (no @ or placeholder)
        const hasRealEmail = p.email && p.email.includes('@') && !p.email.includes('placeholder')
        return !hasRealEmail
      })
      .map(p => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        email: p.email,
        member_stage: p.member_stage,
        cell_id: p.cell_id,
        cell_name: (p.cell as { name: string } | null)?.name,
        created_at: p.created_at,
        has_auth_user: false,
      }))

    return { success: true, data: visitorProfiles }
  } catch (error) {
    console.error('Error in getVisitorProfiles:', error)
    return { success: false, error: 'Erro ao buscar visitantes' }
  }
}



// =====================================================
// LINK VISITOR PROFILE TO REAL PROFILE
// =====================================================

/**
 * Link a visitor profile (created by leader) to a real profile (with auth)
 * This transfers all attendance history and other data to the real profile
 */
export async function linkProfiles(input: {
  visitor_profile_id: string
  real_profile_id: string
}): Promise<{
  success: boolean
  error?: string
  transferred?: {
    attendance_records: number
    cell_id?: string
    member_stage?: string
  }
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const validated = linkProfilesSchema.parse(input)
    const supabase = await createClient()

    // Verify both profiles exist and belong to the same church
    const { data: visitorProfile, error: visitorError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, cell_id, member_stage, church_id')
      .eq('id', validated.visitor_profile_id)
      .single()

    if (visitorError || !visitorProfile) {
      return { success: false, error: 'Perfil de visitante não encontrado' }
    }

    const { data: realProfile, error: realError } = await supabase
      .from('profiles')
      .select('id, full_name, email, cell_id, member_stage, church_id')
      .eq('id', validated.real_profile_id)
      .single()

    if (realError || !realProfile) {
      return { success: false, error: 'Perfil real não encontrado' }
    }

    // Check permissions
    const canLink = 
      profile.role === 'PASTOR' || 
      profile.id === validated.real_profile_id || // User linking their own profile
      (profile.role === 'LEADER' && visitorProfile.cell_id === profile.cell_id)

    if (!canLink) {
      return { success: false, error: 'Sem permissão para vincular estes perfis' }
    }

    // Verify same church
    if (visitorProfile.church_id !== realProfile.church_id) {
      return { success: false, error: 'Perfis pertencem a igrejas diferentes' }
    }

    // Start transferring data

    // 1. Transfer attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .update({ profile_id: validated.real_profile_id })
      .eq('profile_id', validated.visitor_profile_id)
      .select('id')

    if (attendanceError) {
      console.error('Error transferring attendance:', attendanceError)
      return { success: false, error: 'Erro ao transferir histórico de presença' }
    }

    // 2. Update real profile with visitor's cell_id if not set
    const updates: Record<string, unknown> = {}
    
    if (!realProfile.cell_id && visitorProfile.cell_id) {
      updates.cell_id = visitorProfile.cell_id
    }

    // 3. Upgrade member_stage if visitor has higher stage
    const stageOrder = ['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR']
    const visitorStageIndex = stageOrder.indexOf(visitorProfile.member_stage)
    const realStageIndex = stageOrder.indexOf(realProfile.member_stage)
    
    if (visitorStageIndex > realStageIndex) {
      updates.member_stage = visitorProfile.member_stage
    }

    // 4. Transfer phone if real profile doesn't have one
    if (!realProfile.email && visitorProfile.phone) {
      // Don't overwrite, but we could add phone if missing
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', validated.real_profile_id)

      if (updateError) {
        console.error('Error updating real profile:', updateError)
        // Continue anyway, attendance was already transferred
      }
    }

    // 5. Deactivate the visitor profile
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.visitor_profile_id)

    if (deactivateError) {
      console.error('Error deactivating visitor profile:', deactivateError)
      // Continue anyway
    }

    revalidatePath('/minha-celula/membros')
    revalidatePath('/membro')

    return {
      success: true,
      transferred: {
        attendance_records: attendanceRecords?.length || 0,
        cell_id: updates.cell_id as string | undefined,
        member_stage: updates.member_stage as string | undefined,
      }
    }
  } catch (error) {
    console.error('Error in linkProfiles:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao vincular perfis' }
  }
}

// =====================================================
// SEARCH PROFILES FOR LINKING (Leader use)
// =====================================================

/**
 * Search for profiles to link - used by leaders
 */
export async function searchProfilesForLinking(search: string): Promise<{
  success: boolean
  visitors?: VisitorProfile[]
  realProfiles?: Array<{
    id: string
    full_name: string
    email: string
    phone: string | null
  }>
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (!['LEADER', 'PASTOR'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão' }
    }

    const supabase = await createClient()
    const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')

    // Search visitor profiles (no email)
    const { data: visitors } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        email,
        member_stage,
        cell_id,
        created_at,
        cell:cells!profiles_cell_id_fkey(name)
      `)
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .or(`email.is.null,email.not.ilike.%@%`)
      .ilike('full_name', `%${sanitizedSearch}%`)
      .limit(10)

    // Search real profiles (with email)
    const { data: realProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .not('email', 'is', null)
      .ilike('email', '%@%')
      .ilike('full_name', `%${sanitizedSearch}%`)
      .limit(10)

    return {
      success: true,
      visitors: (visitors || []).map(v => ({
        id: v.id,
        full_name: v.full_name,
        phone: v.phone,
        email: v.email,
        member_stage: v.member_stage,
        cell_id: v.cell_id,
        cell_name: (v.cell as { name: string } | null)?.name,
        created_at: v.created_at,
        has_auth_user: false,
      })),
      realProfiles: (realProfiles || []).map(r => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email!,
        phone: r.phone,
      })),
    }
  } catch (error) {
    console.error('Error in searchProfilesForLinking:', error)
    return { success: false, error: 'Erro na busca' }
  }
}


