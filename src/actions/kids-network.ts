'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { KIDS_ROLES, canManageKidsNetwork } from '@/lib/constants'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const uuidSchema = z.string().uuid('ID inválido')

const addToNetworkSchema = z.object({
  profileId: z.string().uuid('ID do perfil inválido'),
  kidsRole: z.enum(['PASTORA_KIDS', 'DISCIPULADORA_KIDS', 'LEADER_KIDS', 'MEMBER_KIDS']),
  kidsCellId: z.string().uuid('ID da célula inválido').optional().nullable(),
})

// =====================================================
// TYPES
// =====================================================

export interface KidsNetworkMember {
  id: string
  profile_id: string
  kids_role: string
  kids_cell_id: string | null
  created_at: string
  profile: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    photo_url: string | null
    role: string
  }
  kids_cell?: {
    id: string
    name: string
  } | null
}

// =====================================================
// GET FUNCTIONS
// =====================================================

/**
 * Get all members of the Kids Network
 */
export async function getKidsNetworkMembers(): Promise<KidsNetworkMember[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Kids Network members can view
  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // First get memberships
  const { data: memberships, error } = await supabase
    .from('kids_network_membership')
    .select(`
      id,
      profile_id,
      kids_role,
      kids_cell_id,
      created_at,
      profile:profiles!kids_network_membership_profile_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url,
        role
      )
    `)
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kids network members:', error)
    return []
  }

  // Get cell IDs that have memberships
  const cellIds = (memberships || [])
    .map(m => m.kids_cell_id)
    .filter((id): id is string => id !== null)

  // Fetch cells if there are any
  let cellsMap: Record<string, { id: string; name: string }> = {}
  if (cellIds.length > 0) {
    const { data: cells } = await supabase
      .from('kids_cells')
      .select('id, name')
      .in('id', cellIds)

    if (cells) {
      cellsMap = cells.reduce((acc, cell) => {
        acc[cell.id] = cell
        return acc
      }, {} as Record<string, { id: string; name: string }>)
    }
  }

  // Combine memberships with cells
  const data = (memberships || []).map(m => ({
    ...m,
    kids_cell: m.kids_cell_id ? cellsMap[m.kids_cell_id] || null : null
  }))

  return data as unknown as KidsNetworkMember[]
}

/**
 * Get members by role
 */
export async function getKidsNetworkMembersByRole(kidsRole: string): Promise<KidsNetworkMember[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  const { data: memberships, error } = await supabase
    .from('kids_network_membership')
    .select(`
      id,
      profile_id,
      kids_role,
      kids_cell_id,
      created_at,
      profile:profiles!kids_network_membership_profile_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url,
        role
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('kids_role', kidsRole)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kids network members by role:', error)
    return []
  }

  // Get cell IDs
  const cellIds = (memberships || [])
    .map(m => m.kids_cell_id)
    .filter((id): id is string => id !== null)

  let cellsMap: Record<string, { id: string; name: string }> = {}
  if (cellIds.length > 0) {
    const { data: cells } = await supabase
      .from('kids_cells')
      .select('id, name')
      .in('id', cellIds)

    if (cells) {
      cellsMap = cells.reduce((acc, cell) => {
        acc[cell.id] = cell
        return acc
      }, {} as Record<string, { id: string; name: string }>)
    }
  }

  const data = (memberships || []).map(m => ({
    ...m,
    kids_cell: m.kids_cell_id ? cellsMap[m.kids_cell_id] || null : null
  }))

  return data as unknown as KidsNetworkMember[]
}

/**
 * Get potential members to add to Kids Network (not already in network)
 */
export async function getPotentialKidsNetworkMembers() {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (!canManageKidsNetwork(profile.role, profile.kids_role)) {
    throw new Error('Apenas Pastor, Pastora Kids ou Discipuladora Kids podem adicionar membros')
  }

  const supabase = await createClient()

  // First, get all profile IDs that are already in kids network
  const { data: existingMembers } = await supabase
    .from('kids_network_membership')
    .select('profile_id')
    .eq('church_id', profile.church_id)

  const existingProfileIds = (existingMembers || []).map(m => m.profile_id)

  // Get all active members
  const { data: allMembers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, photo_url, role')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('Error fetching potential members:', error)
    return []
  }

  // Filter out members who are already in kids network
  const potentialMembers = (allMembers || []).filter(
    member => !existingProfileIds.includes(member.id)
  )

  return potentialMembers
}

/**
 * Get Kids Network stats for dashboard
 */
export async function getKidsNetworkStats() {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get counts by role
  const { data: membershipData } = await supabase
    .from('kids_network_membership')
    .select('kids_role')
    .eq('church_id', profile.church_id)

  const roleCounts = {
    PASTORA_KIDS: 0,
    DISCIPULADORA_KIDS: 0,
    LEADER_KIDS: 0,
    MEMBER_KIDS: 0,
  }

  for (const m of membershipData || []) {
    if (m.kids_role in roleCounts) {
      roleCounts[m.kids_role as keyof typeof roleCounts]++
    }
  }

  // Get cells count
  const { count: cellsCount } = await supabase
    .from('kids_cells')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)
    .eq('status', 'ACTIVE')

  // Get children count
  const { count: childrenCount } = await supabase
    .from('kids_children')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)
    .eq('is_active', true)

  return {
    totalMembers: (membershipData || []).length,
    pastorasKids: roleCounts.PASTORA_KIDS,
    discipuladorasKids: roleCounts.DISCIPULADORA_KIDS,
    leadersKids: roleCounts.LEADER_KIDS,
    membersKids: roleCounts.MEMBER_KIDS,
    activeCells: cellsCount || 0,
    activeChildren: childrenCount || 0,
  }
}

// =====================================================
// MUTATION FUNCTIONS
// =====================================================

/**
 * Add a member to the Kids Network
 */
export async function addToKidsNetwork(data: {
  profileId: string
  kidsRole: string
  kidsCellId?: string | null
}) {
  // Validate input
  const parseResult = addToNetworkSchema.safeParse(data)
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (!canManageKidsNetwork(profile.role, profile.kids_role)) {
    throw new Error('Apenas Pastor, Pastora Kids ou Discipuladora Kids podem adicionar membros')
  }

  const supabase = await createClient()

  // Verify target profile exists and is in same church
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, church_id')
    .eq('id', data.profileId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (profileError) {
    console.error('Error fetching target profile:', profileError)
    throw new Error('Erro ao buscar membro')
  }

  if (!targetProfile) {
    throw new Error('Membro não encontrado na sua igreja')
  }

  // Check if already in kids network by looking at membership table directly
  const { data: existingMembership } = await supabase
    .from('kids_network_membership')
    .select('id')
    .eq('profile_id', data.profileId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (existingMembership) {
    throw new Error('Este membro já faz parte da Rede Kids')
  }

  // Add to kids network
  const { error } = await supabase
    .from('kids_network_membership')
    .insert({
      church_id: profile.church_id,
      profile_id: data.profileId,
      kids_role: data.kidsRole,
      kids_cell_id: data.kidsCellId || null,
      added_by: profile.id,
    })

  if (error) {
    console.error('Error adding to kids network:', error)
    throw new Error('Erro ao adicionar à Rede Kids')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/equipe')
  return { success: true }
}

/**
 * Update a member's role in Kids Network
 */
export async function updateKidsNetworkRole(profileId: string, newRole: string) {
  // Validate inputs
  const profileIdResult = uuidSchema.safeParse(profileId)
  if (!profileIdResult.success) {
    throw new Error('ID do perfil inválido')
  }

  if (!Object.values(KIDS_ROLES).includes(newRole as any)) {
    throw new Error('Role inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can change roles
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem alterar roles')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('kids_network_membership')
    .update({ kids_role: newRole })
    .eq('profile_id', profileId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating kids network role:', error)
    throw new Error('Erro ao atualizar role')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/equipe')
  return { success: true }
}

/**
 * Remove a member from Kids Network
 */
export async function removeFromKidsNetwork(profileId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(profileId)
  if (!parseResult.success) {
    throw new Error('ID do perfil inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can remove members
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem remover membros')
  }

  const supabase = await createClient()

  // Remove any cell supervision assignments first
  await supabase
    .from('kids_cell_supervision')
    .delete()
    .eq('discipuladora_id', profileId)
    .eq('church_id', profile.church_id)

  // Remove from network (trigger will update profile flags)
  const { error } = await supabase
    .from('kids_network_membership')
    .delete()
    .eq('profile_id', profileId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error removing from kids network:', error)
    throw new Error('Erro ao remover da Rede Kids')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/equipe')
  return { success: true }
}

/**
 * Assign a member to a Kids Cell
 */
export async function assignToKidsCell(profileId: string, kidsCellId: string | null) {
  // Validate inputs
  const profileIdResult = uuidSchema.safeParse(profileId)
  if (!profileIdResult.success) {
    throw new Error('ID do perfil inválido')
  }

  if (kidsCellId) {
    const cellIdResult = uuidSchema.safeParse(kidsCellId)
    if (!cellIdResult.success) {
      throw new Error('ID da célula inválido')
    }
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (!canManageKidsNetwork(profile.role, profile.kids_role)) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Verify cell exists if provided
  if (kidsCellId) {
    const { data: cell } = await supabase
      .from('kids_cells')
      .select('id')
      .eq('id', kidsCellId)
      .eq('church_id', profile.church_id)
      .maybeSingle()

    if (!cell) {
      throw new Error('Célula não encontrada')
    }
  }

  // Update membership
  const { error } = await supabase
    .from('kids_network_membership')
    .update({ kids_cell_id: kidsCellId })
    .eq('profile_id', profileId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error assigning to kids cell:', error)
    throw new Error('Erro ao atribuir célula')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/equipe')
  revalidatePath('/rede-kids/celulas')
  return { success: true }
}
