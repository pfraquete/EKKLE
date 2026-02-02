'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MAX_CELLS_PER_DISCIPULADOR } from '@/lib/constants'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const uuidSchema = z.string().uuid('ID inválido')

// =====================================================
// PASTOR ACTIONS FOR MANAGING DISCIPULADORES
// =====================================================

/**
 * Get all Discipuladores in the church (OPTIMIZED - single query for counts)
 */
export async function getDiscipuladores() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Query 1: Get all discipuladores
  const { data: discipuladores, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      cell_id
    `)
    .eq('church_id', profile.church_id)
    .eq('role', 'DISCIPULADOR')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('Error fetching discipuladores:', error)
    return []
  }

  if (!discipuladores || discipuladores.length === 0) {
    return []
  }

  // Query 2: Get all supervision counts in one query
  const discipuladorIds = discipuladores.map(d => d.id)
  const { data: supervisionCounts } = await supabase
    .from('cell_supervision')
    .select('discipulador_id')
    .in('discipulador_id', discipuladorIds)
    .eq('church_id', profile.church_id)

  // Count per discipulador
  const countsMap: Record<string, number> = {}
  for (const s of supervisionCounts || []) {
    countsMap[s.discipulador_id] = (countsMap[s.discipulador_id] || 0) + 1
  }

  // Build result
  return discipuladores.map(d => ({
    ...d,
    supervisedCellsCount: countsMap[d.id] || 0
  }))
}

/**
 * Get potential members who can be promoted to Discipulador
 */
export async function getPotentialDiscipuladores() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get members and leaders who are active
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, photo_url, role, member_stage')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .in('role', ['MEMBER', 'LEADER'])
    .order('full_name')

  if (error) {
    console.error('Error fetching potential discipuladores:', error)
    return []
  }

  return data || []
}

/**
 * Promote a member/leader to Discipulador
 */
export async function promoteToDiscipulador(profileId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(profileId)
  if (!parseResult.success) {
    throw new Error('ID do perfil inválido')
  }

  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Apenas pastores podem promover a Discipulador')
  }

  const supabase = await createClient()

  // Verify the target profile exists and is in the same church
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, role, church_id')
    .eq('id', profileId)
    .eq('church_id', profile.church_id)
    .single()

  if (!targetProfile) {
    throw new Error('Membro não encontrado')
  }

  if (targetProfile.role === 'DISCIPULADOR') {
    throw new Error('Este membro já é um Discipulador')
  }

  if (targetProfile.role === 'PASTOR') {
    throw new Error('Não é possível alterar o papel do pastor')
  }

  // Update role to DISCIPULADOR
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'DISCIPULADOR' })
    .eq('id', profileId)
    .eq('church_id', profile.church_id) // Extra safety

  if (error) {
    console.error('Error promoting to discipulador:', error)
    throw new Error('Erro ao promover membro')
  }

  revalidatePath('/membros')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/discipuladores')
  return { success: true }
}

/**
 * Demote a Discipulador back to Member
 */
export async function demoteFromDiscipulador(profileId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(profileId)
  if (!parseResult.success) {
    throw new Error('ID do perfil inválido')
  }

  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Apenas pastores podem alterar papéis')
  }

  const supabase = await createClient()

  // Verify the target profile
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, role, church_id')
    .eq('id', profileId)
    .eq('church_id', profile.church_id)
    .single()

  if (!targetProfile) {
    throw new Error('Membro não encontrado')
  }

  if (targetProfile.role !== 'DISCIPULADOR') {
    throw new Error('Este membro não é um Discipulador')
  }

  // Remove all cell supervision assignments first
  await supabase
    .from('cell_supervision')
    .delete()
    .eq('discipulador_id', profileId)
    .eq('church_id', profile.church_id) // Extra safety

  // Update role to MEMBER
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'MEMBER' })
    .eq('id', profileId)
    .eq('church_id', profile.church_id) // Extra safety

  if (error) {
    console.error('Error demoting discipulador:', error)
    throw new Error('Erro ao alterar papel')
  }

  revalidatePath('/membros')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/discipuladores')
  return { success: true }
}

/**
 * Assign a cell to a Discipulador
 */
export async function assignCellToDiscipulador(cellId: string, discipuladorId: string) {
  // Validate inputs
  const cellIdResult = uuidSchema.safeParse(cellId)
  const discipuladorIdResult = uuidSchema.safeParse(discipuladorId)

  if (!cellIdResult.success) {
    throw new Error('ID da célula inválido')
  }
  if (!discipuladorIdResult.success) {
    throw new Error('ID do discipulador inválido')
  }

  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Apenas pastores podem atribuir células')
  }

  const supabase = await createClient()

  // Verify the discipulador exists and is in the same church
  const { data: discipulador } = await supabase
    .from('profiles')
    .select('id, role, church_id')
    .eq('id', discipuladorId)
    .eq('church_id', profile.church_id)
    .eq('role', 'DISCIPULADOR')
    .single()

  if (!discipulador) {
    throw new Error('Discipulador não encontrado')
  }

  // Check if discipulador already has max cells
  const { count } = await supabase
    .from('cell_supervision')
    .select('*', { count: 'exact', head: true })
    .eq('discipulador_id', discipuladorId)
    .eq('church_id', profile.church_id)

  if (count && count >= MAX_CELLS_PER_DISCIPULADOR) {
    throw new Error(`Este Discipulador já supervisiona o máximo de ${MAX_CELLS_PER_DISCIPULADOR} células`)
  }

  // Verify the cell exists and is in the same church
  const { data: cell } = await supabase
    .from('cells')
    .select('id, church_id')
    .eq('id', cellId)
    .eq('church_id', profile.church_id)
    .single()

  if (!cell) {
    throw new Error('Célula não encontrada')
  }

  // Check if cell already has a supervisor
  const { data: existingSupervision } = await supabase
    .from('cell_supervision')
    .select('id, discipulador_id')
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id)
    .single()

  if (existingSupervision) {
    // Update existing supervision
    const { error } = await supabase
      .from('cell_supervision')
      .update({
        discipulador_id: discipuladorId,
        assigned_by: profile.id,
        assigned_at: new Date().toISOString()
      })
      .eq('id', existingSupervision.id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error updating cell supervision:', error)
      throw new Error('Erro ao atualizar supervisão')
    }
  } else {
    // Create new supervision
    const { error } = await supabase
      .from('cell_supervision')
      .insert({
        church_id: profile.church_id,
        cell_id: cellId,
        discipulador_id: discipuladorId,
        assigned_by: profile.id
      })

    if (error) {
      console.error('Error creating cell supervision:', error)
      throw new Error('Erro ao atribuir célula')
    }
  }

  revalidatePath('/celulas')
  revalidatePath('/supervisao')
  revalidatePath('/dashboard/discipuladores')
  return { success: true }
}

/**
 * Remove cell supervision
 */
export async function removeCellSupervision(cellId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(cellId)
  if (!parseResult.success) {
    throw new Error('ID da célula inválido')
  }

  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Apenas pastores podem remover supervisão')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('cell_supervision')
    .delete()
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error removing cell supervision:', error)
    throw new Error('Erro ao remover supervisão')
  }

  revalidatePath('/celulas')
  revalidatePath('/supervisao')
  revalidatePath('/dashboard/discipuladores')
  return { success: true }
}

/**
 * Get cells with their supervision status (OPTIMIZED - batch queries)
 */
export async function getCellsWithSupervision() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Query 1: Get all cells
  const { data: cells, error } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      status,
      leader_id
    `)
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching cells:', error)
    return []
  }

  if (!cells || cells.length === 0) {
    return []
  }

  // Extract IDs for batch queries
  const cellIds = cells.map(c => c.id)
  const leaderIds = cells.map(c => c.leader_id).filter(Boolean) as string[]

  // Query 2: Get all leaders in one query
  const { data: leaders } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', leaderIds.length > 0 ? leaderIds : ['none'])
    .eq('church_id', profile.church_id)

  // Create leader lookup map
  const leaderMap: Record<string, { id: string; full_name: string }> = {}
  for (const leader of leaders || []) {
    leaderMap[leader.id] = leader
  }

  // Query 3: Get all supervisions in one query
  const { data: supervisions } = await supabase
    .from('cell_supervision')
    .select('id, cell_id, discipulador_id')
    .in('cell_id', cellIds)
    .eq('church_id', profile.church_id)

  // Get discipulador IDs
  const discipuladorIds = (supervisions || []).map(s => s.discipulador_id)

  // Query 4: Get all discipuladores in one query
  const { data: discipuladores } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', discipuladorIds.length > 0 ? discipuladorIds : ['none'])
    .eq('church_id', profile.church_id)

  // Create discipulador lookup map
  const discipuladorMap: Record<string, { id: string; full_name: string }> = {}
  for (const d of discipuladores || []) {
    discipuladorMap[d.id] = d
  }

  // Create supervision lookup map
  const supervisionMap: Record<string, { id: string; discipulador: { id: string; full_name: string } | null }> = {}
  for (const s of supervisions || []) {
    supervisionMap[s.cell_id] = {
      id: s.id,
      discipulador: discipuladorMap[s.discipulador_id] || null
    }
  }

  // Build result
  return cells.map(cell => ({
    id: cell.id,
    name: cell.name,
    status: cell.status,
    leader: cell.leader_id ? leaderMap[cell.leader_id] || null : null,
    supervision: supervisionMap[cell.id] || null
  }))
}
