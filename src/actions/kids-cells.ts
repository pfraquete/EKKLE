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

const createKidsCellSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  leaderId: z.string().uuid('ID do líder inválido').optional().nullable(),
  dayOfWeek: z.number().min(0).max(6).optional().nullable(),
  meetingTime: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  ageRangeMin: z.number().min(0).max(18).default(0),
  ageRangeMax: z.number().min(0).max(18).default(12),
})

const updateKidsCellSchema = z.object({
  id: z.string().uuid('ID da célula inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  leaderId: z.string().uuid('ID do líder inválido').optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional().nullable(),
  meetingTime: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  ageRangeMin: z.number().min(0).max(18).optional(),
  ageRangeMax: z.number().min(0).max(18).optional(),
})

// =====================================================
// TYPES
// =====================================================

export interface KidsCell {
  id: string
  church_id: string
  name: string
  leader_id: string | null
  status: 'ACTIVE' | 'INACTIVE'
  day_of_week: number | null
  meeting_time: string | null
  address: string | null
  neighborhood: string | null
  age_range_min: number
  age_range_max: number
  created_at: string
  updated_at: string
  leader?: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    photo_url: string | null
  } | null
  _count?: {
    members: number
    children: number
  }
}

export interface KidsCellWithStats extends KidsCell {
  members_count: number
  children_count: number
}

// =====================================================
// GET FUNCTIONS
// =====================================================

/**
 * Get all Kids Cells for the church
 */
export async function getKidsCells(): Promise<KidsCell[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Kids Network members can view
  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_cells')
    .select(`
      *,
      leader:profiles!kids_cells_leader_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching kids cells:', error)
    return []
  }

  return (data || []) as unknown as KidsCell[]
}

/**
 * Get active Kids Cells only
 */
export async function getActiveKidsCells(): Promise<KidsCell[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_cells')
    .select(`
      *,
      leader:profiles!kids_cells_leader_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('status', 'ACTIVE')
    .order('name')

  if (error) {
    console.error('Error fetching active kids cells:', error)
    return []
  }

  return (data || []) as unknown as KidsCell[]
}

/**
 * Get a single Kids Cell by ID
 */
export async function getKidsCell(cellId: string): Promise<KidsCell | null> {
  const parseResult = uuidSchema.safeParse(cellId)
  if (!parseResult.success) {
    throw new Error('ID da célula inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_cells')
    .select(`
      *,
      leader:profiles!kids_cells_leader_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('id', cellId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching kids cell:', error)
    return null
  }

  return data as unknown as KidsCell
}

/**
 * Get Kids Cells with member and children counts
 */
export async function getKidsCellsWithStats(): Promise<KidsCellWithStats[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get cells with leader
  const { data: cells, error: cellsError } = await supabase
    .from('kids_cells')
    .select(`
      *,
      leader:profiles!kids_cells_leader_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('church_id', profile.church_id)
    .order('name')

  if (cellsError) {
    console.error('Error fetching kids cells:', cellsError)
    return []
  }

  // Get member counts per cell
  const { data: memberCounts } = await supabase
    .from('kids_network_membership')
    .select('kids_cell_id')
    .eq('church_id', profile.church_id)
    .not('kids_cell_id', 'is', null)

  // Get children counts per cell
  const { data: childrenCounts } = await supabase
    .from('kids_children')
    .select('kids_cell_id')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .not('kids_cell_id', 'is', null)

  // Calculate counts
  const memberCountMap: Record<string, number> = {}
  const childrenCountMap: Record<string, number> = {}

  for (const m of memberCounts || []) {
    if (m.kids_cell_id) {
      memberCountMap[m.kids_cell_id] = (memberCountMap[m.kids_cell_id] || 0) + 1
    }
  }

  for (const c of childrenCounts || []) {
    if (c.kids_cell_id) {
      childrenCountMap[c.kids_cell_id] = (childrenCountMap[c.kids_cell_id] || 0) + 1
    }
  }

  // Merge data
  const cellsWithStats = (cells || []).map(cell => ({
    ...cell,
    members_count: memberCountMap[cell.id] || 0,
    children_count: childrenCountMap[cell.id] || 0,
  }))

  return cellsWithStats as unknown as KidsCellWithStats[]
}

/**
 * Get cells supervised by a specific Discipuladora Kids
 */
export async function getSupervisionCells(discipuladoraId?: string): Promise<KidsCell[]> {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  // If no ID provided, use current user (for Discipuladora viewing own cells)
  const targetId = discipuladoraId || profile.id

  const supabase = await createClient()

  // Get cell IDs from supervision table
  const { data: supervisions, error: supError } = await supabase
    .from('kids_cell_supervision')
    .select('kids_cell_id')
    .eq('discipuladora_id', targetId)
    .eq('church_id', profile.church_id)

  if (supError) {
    console.error('Error fetching supervision:', supError)
    return []
  }

  if (!supervisions || supervisions.length === 0) {
    return []
  }

  const cellIds = supervisions.map(s => s.kids_cell_id)

  // Get full cell data
  const { data: cells, error: cellsError } = await supabase
    .from('kids_cells')
    .select(`
      *,
      leader:profiles!kids_cells_leader_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .in('id', cellIds)
    .eq('church_id', profile.church_id)
    .order('name')

  if (cellsError) {
    console.error('Error fetching supervised cells:', cellsError)
    return []
  }

  return (cells || []) as unknown as KidsCell[]
}

/**
 * Get available leaders (LEADER_KIDS without a cell)
 */
export async function getAvailableKidsLeaders() {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (!canManageKidsNetwork(profile.role, profile.kids_role)) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get LEADER_KIDS members without a cell
  const { data, error } = await supabase
    .from('kids_network_membership')
    .select(`
      profile_id,
      profile:profiles!kids_network_membership_profile_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('kids_role', 'LEADER_KIDS')
    .is('kids_cell_id', null)

  if (error) {
    console.error('Error fetching available leaders:', error)
    return []
  }

  return (data || [])
    .filter(d => d.profile)
    .map(d => {
      const prof = d.profile as unknown as {
        id: string
        full_name: string
        email: string | null
        phone: string | null
        photo_url: string | null
      }
      return {
        id: prof.id,
        full_name: prof.full_name,
        email: prof.email,
        phone: prof.phone,
        photo_url: prof.photo_url,
      }
    })
}

export interface AvailableKidsLeader {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  photo_url: string | null
}

// =====================================================
// MUTATION FUNCTIONS
// =====================================================

/**
 * Create a new Kids Cell
 */
export async function createKidsCell(data: {
  name: string
  leaderId?: string | null
  dayOfWeek?: number | null
  meetingTime?: string | null
  address?: string | null
  neighborhood?: string | null
  ageRangeMin?: number
  ageRangeMax?: number
}) {
  // Validate input
  const parseResult = createKidsCellSchema.safeParse(data)
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can create cells
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem criar células')
  }

  const supabase = await createClient()

  // Verify leader is LEADER_KIDS if provided
  if (data.leaderId) {
    const { data: leaderMembership } = await supabase
      .from('kids_network_membership')
      .select('kids_role')
      .eq('profile_id', data.leaderId)
      .eq('church_id', profile.church_id)
      .maybeSingle()

    if (!leaderMembership || leaderMembership.kids_role !== 'LEADER_KIDS') {
      throw new Error('O líder selecionado não é um Líder Kids')
    }
  }

  // Create cell
  const { data: cell, error } = await supabase
    .from('kids_cells')
    .insert({
      church_id: profile.church_id,
      name: data.name,
      leader_id: data.leaderId || null,
      day_of_week: data.dayOfWeek ?? null,
      meeting_time: data.meetingTime || null,
      address: data.address || null,
      neighborhood: data.neighborhood || null,
      age_range_min: data.ageRangeMin ?? 0,
      age_range_max: data.ageRangeMax ?? 12,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating kids cell:', error)
    throw new Error('Erro ao criar célula kids')
  }

  // If leader provided, update their membership to this cell
  if (data.leaderId) {
    await supabase
      .from('kids_network_membership')
      .update({ kids_cell_id: cell.id })
      .eq('profile_id', data.leaderId)
      .eq('church_id', profile.church_id)
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/celulas')
  return { success: true, cell }
}

/**
 * Update a Kids Cell
 */
export async function updateKidsCell(data: {
  id: string
  name?: string
  leaderId?: string | null
  status?: 'ACTIVE' | 'INACTIVE'
  dayOfWeek?: number | null
  meetingTime?: string | null
  address?: string | null
  neighborhood?: string | null
  ageRangeMin?: number
  ageRangeMax?: number
}) {
  // Validate input
  const parseResult = updateKidsCellSchema.safeParse(data)
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can update cells
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem atualizar células')
  }

  const supabase = await createClient()

  // Verify cell exists
  const { data: existingCell } = await supabase
    .from('kids_cells')
    .select('id, leader_id')
    .eq('id', data.id)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (!existingCell) {
    throw new Error('Célula não encontrada')
  }

  // Verify new leader is LEADER_KIDS if provided
  if (data.leaderId !== undefined && data.leaderId !== null) {
    const { data: leaderMembership } = await supabase
      .from('kids_network_membership')
      .select('kids_role')
      .eq('profile_id', data.leaderId)
      .eq('church_id', profile.church_id)
      .maybeSingle()

    if (!leaderMembership || leaderMembership.kids_role !== 'LEADER_KIDS') {
      throw new Error('O líder selecionado não é um Líder Kids')
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.leaderId !== undefined) updateData.leader_id = data.leaderId
  if (data.status !== undefined) updateData.status = data.status
  if (data.dayOfWeek !== undefined) updateData.day_of_week = data.dayOfWeek
  if (data.meetingTime !== undefined) updateData.meeting_time = data.meetingTime
  if (data.address !== undefined) updateData.address = data.address
  if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood
  if (data.ageRangeMin !== undefined) updateData.age_range_min = data.ageRangeMin
  if (data.ageRangeMax !== undefined) updateData.age_range_max = data.ageRangeMax

  // Update cell
  const { error } = await supabase
    .from('kids_cells')
    .update(updateData)
    .eq('id', data.id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating kids cell:', error)
    throw new Error('Erro ao atualizar célula kids')
  }

  // Handle leader change
  if (data.leaderId !== undefined) {
    // Remove old leader from this cell
    if (existingCell.leader_id && existingCell.leader_id !== data.leaderId) {
      await supabase
        .from('kids_network_membership')
        .update({ kids_cell_id: null })
        .eq('profile_id', existingCell.leader_id)
        .eq('church_id', profile.church_id)
    }

    // Assign new leader to this cell
    if (data.leaderId) {
      await supabase
        .from('kids_network_membership')
        .update({ kids_cell_id: data.id })
        .eq('profile_id', data.leaderId)
        .eq('church_id', profile.church_id)
    }
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/celulas')
  revalidatePath(`/rede-kids/celulas/${data.id}`)
  return { success: true }
}

/**
 * Delete a Kids Cell
 */
export async function deleteKidsCell(cellId: string) {
  const parseResult = uuidSchema.safeParse(cellId)
  if (!parseResult.success) {
    throw new Error('ID da célula inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can delete cells
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem excluir células')
  }

  const supabase = await createClient()

  // Remove all supervisions for this cell
  await supabase
    .from('kids_cell_supervision')
    .delete()
    .eq('kids_cell_id', cellId)
    .eq('church_id', profile.church_id)

  // Remove cell from memberships
  await supabase
    .from('kids_network_membership')
    .update({ kids_cell_id: null })
    .eq('kids_cell_id', cellId)
    .eq('church_id', profile.church_id)

  // Remove cell from children
  await supabase
    .from('kids_children')
    .update({ kids_cell_id: null })
    .eq('kids_cell_id', cellId)
    .eq('church_id', profile.church_id)

  // Delete the cell
  const { error } = await supabase
    .from('kids_cells')
    .delete()
    .eq('id', cellId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting kids cell:', error)
    throw new Error('Erro ao excluir célula kids')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/celulas')
  return { success: true }
}

// =====================================================
// SUPERVISION FUNCTIONS
// =====================================================

/**
 * Assign a Discipuladora Kids to supervise a cell
 */
export async function assignCellSupervision(kidsCellId: string, discipuladoraId: string) {
  const cellIdResult = uuidSchema.safeParse(kidsCellId)
  const discIdResult = uuidSchema.safeParse(discipuladoraId)

  if (!cellIdResult.success || !discIdResult.success) {
    throw new Error('ID inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can assign supervision
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem atribuir supervisão')
  }

  const supabase = await createClient()

  // Verify discipuladora is DISCIPULADORA_KIDS
  const { data: membership } = await supabase
    .from('kids_network_membership')
    .select('kids_role')
    .eq('profile_id', discipuladoraId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (!membership || membership.kids_role !== 'DISCIPULADORA_KIDS') {
    throw new Error('A pessoa selecionada não é uma Discipuladora Kids')
  }

  // Verify cell exists
  const { data: cell } = await supabase
    .from('kids_cells')
    .select('id')
    .eq('id', kidsCellId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (!cell) {
    throw new Error('Célula não encontrada')
  }

  // Check limit (trigger will also enforce this)
  const { count } = await supabase
    .from('kids_cell_supervision')
    .select('*', { count: 'exact', head: true })
    .eq('discipuladora_id', discipuladoraId)
    .eq('church_id', profile.church_id)

  if ((count || 0) >= 5) {
    throw new Error('Esta Discipuladora Kids já supervisiona o máximo de 5 células')
  }

  // Create supervision (upsert to handle existing)
  const { error } = await supabase
    .from('kids_cell_supervision')
    .upsert({
      church_id: profile.church_id,
      discipuladora_id: discipuladoraId,
      kids_cell_id: kidsCellId,
      assigned_by: profile.id,
    }, {
      onConflict: 'church_id,kids_cell_id'
    })

  if (error) {
    console.error('Error assigning supervision:', error)
    if (error.message.includes('5 células')) {
      throw new Error('Esta Discipuladora Kids já supervisiona o máximo de 5 células')
    }
    throw new Error('Erro ao atribuir supervisão')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/celulas')
  revalidatePath('/rede-kids/supervisao')
  return { success: true }
}

/**
 * Remove cell supervision
 */
export async function removeCellSupervision(kidsCellId: string) {
  const parseResult = uuidSchema.safeParse(kidsCellId)
  if (!parseResult.success) {
    throw new Error('ID da célula inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  // Only Pastor or Pastora Kids can remove supervision
  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Apenas Pastor ou Pastora Kids podem remover supervisão')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('kids_cell_supervision')
    .delete()
    .eq('kids_cell_id', kidsCellId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error removing supervision:', error)
    throw new Error('Erro ao remover supervisão')
  }

  revalidatePath('/rede-kids')
  revalidatePath('/rede-kids/celulas')
  revalidatePath('/rede-kids/supervisao')
  return { success: true }
}

/**
 * Get supervision info for a cell
 */
export async function getCellSupervision(kidsCellId: string) {
  const parseResult = uuidSchema.safeParse(kidsCellId)
  if (!parseResult.success) {
    throw new Error('ID da célula inválido')
  }

  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_cell_supervision')
    .select(`
      *,
      discipuladora:profiles!kids_cell_supervision_discipuladora_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('kids_cell_id', kidsCellId)
    .eq('church_id', profile.church_id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching supervision:', error)
    return null
  }

  return data
}

/**
 * Get available Discipuladoras Kids for supervision
 */
export async function getAvailableDiscipuladorasKids() {
  const profile = await getProfile()
  if (!profile) {
    throw new Error('Não autenticado')
  }

  if (profile.role !== 'PASTOR' && profile.kids_role !== 'PASTORA_KIDS') {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get DISCIPULADORA_KIDS with their current supervision count
  const { data: discipuladoras, error } = await supabase
    .from('kids_network_membership')
    .select(`
      profile_id,
      profile:profiles!kids_network_membership_profile_id_fkey (
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('kids_role', 'DISCIPULADORA_KIDS')

  if (error) {
    console.error('Error fetching discipuladoras:', error)
    return []
  }

  // Get supervision counts
  const { data: supervisionCounts } = await supabase
    .from('kids_cell_supervision')
    .select('discipuladora_id')
    .eq('church_id', profile.church_id)

  const countMap: Record<string, number> = {}
  for (const s of supervisionCounts || []) {
    countMap[s.discipuladora_id] = (countMap[s.discipuladora_id] || 0) + 1
  }

  // Filter those with less than 5 cells and flatten the profile
  return (discipuladoras || [])
    .filter(d => d.profile && (countMap[d.profile_id] || 0) < 5)
    .map(d => {
      const prof = d.profile as unknown as {
        id: string
        full_name: string
        email: string | null
        phone: string | null
        photo_url: string | null
      }
      return {
        id: prof.id,
        full_name: prof.full_name,
        email: prof.email,
        phone: prof.phone,
        photo_url: prof.photo_url,
        supervision_count: countMap[d.profile_id] || 0
      }
    })
}

export interface AvailableDiscipuladora {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  photo_url: string | null
  supervision_count: number
}
