'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MIN_ATTENDANCE_THRESHOLD, MAX_NOTE_LENGTH } from '@/lib/constants'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const uuidSchema = z.string().uuid('ID inválido')

const noteSchema = z.object({
  cellId: z.string().uuid('ID da célula inválido'),
  note: z.string().min(1, 'Nota não pode estar vazia').max(MAX_NOTE_LENGTH, `Nota não pode exceder ${MAX_NOTE_LENGTH} caracteres`),
  noteType: z.enum(['FEEDBACK', 'CONCERN', 'PRAISE', 'ACTION_ITEM']),
  isPrivate: z.boolean()
})

const reportSchema = z.object({
  meetingId: z.string().uuid('ID da reunião inválido'),
  had_icebreaker: z.boolean(),
  had_worship: z.boolean(),
  had_word: z.boolean(),
  had_prayer: z.boolean(),
  had_snack: z.boolean(),
  visitor_count: z.number().int().min(0),
  decisions_count: z.number().int().min(0),
  observations: z.string().max(2000).optional()
})

// =====================================================
// TYPES
// =====================================================

export interface SupervisedCell {
  id: string
  name: string
  leaderId: string
  leaderName: string
  leaderPhone: string | null
  leaderEmail: string | null
  leaderPhotoUrl: string | null
  membersCount: number
  lastMeetingDate: string | null
  hasRecentReport: boolean
  avgAttendance: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface DiscipuladorDashboardData {
  stats: {
    totalSupervisedCells: number
    totalMembers: number
    overallAttendance: number
    cellsWithoutReports: number
    leadersCount: number
    pendingRequests: number
  }
  supervisedCells: SupervisedCell[]
  recentAlerts: Alert[]
}

export interface Alert {
  id: string
  type: 'no_report' | 'low_attendance' | 'consecutive_absences' | 'no_meeting'
  cellId: string
  cellName: string
  message: string
  severity: 'warning' | 'critical'
  createdAt: string
}

export interface SupervisionNote {
  id: string
  cellId: string
  note: string
  noteType: 'FEEDBACK' | 'CONCERN' | 'PRAISE' | 'ACTION_ITEM'
  isPrivate: boolean
  createdAt: string
}

export interface CellGoal {
  id: string
  cellId: string
  goalType: 'ATTENDANCE_RATE' | 'MONTHLY_GROWTH' | 'REPORTS_SUBMITTED' | 'MEETINGS_PER_MONTH'
  targetValue: number
  period: 'WEEKLY' | 'MONTHLY'
  currentValue?: number
  isActive: boolean
}

// =====================================================
// DASHBOARD DATA (OPTIMIZED - Reduced N+1 queries)
// =====================================================

export async function getDiscipuladorDashboardData(): Promise<DiscipuladorDashboardData | null> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'DISCIPULADOR') return null

  const supabase = await createClient()

  // Query 1: Get all supervised cells with leader info
  const { data: supervision, error } = await supabase
    .from('cell_supervision')
    .select(`
      cell_id,
      cells!inner(
        id,
        name,
        status,
        leader_id,
        leader:profiles!cells_leader_id_fkey(
          id,
          full_name,
          phone,
          email,
          photo_url
        )
      )
    `)
    .eq('discipulador_id', profile.id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error fetching supervised cells:', error)
    return null
  }

  if (!supervision || supervision.length === 0) {
    return {
      stats: {
        totalSupervisedCells: 0,
        totalMembers: 0,
        overallAttendance: 0,
        cellsWithoutReports: 0,
        leadersCount: 0,
        pendingRequests: 0
      },
      supervisedCells: [],
      recentAlerts: []
    }
  }

  // Extract cell IDs for batch queries
  const cellIds = supervision.map(s => s.cell_id)

  // Query 2: Get member counts for all cells in one query
  const { data: memberCounts } = await supabase
    .from('profiles')
    .select('cell_id')
    .in('cell_id', cellIds)
    .eq('is_active', true)

  // Count members per cell
  const membersPerCell: Record<string, number> = {}
  for (const m of memberCounts || []) {
    if (m.cell_id) {
      membersPerCell[m.cell_id] = (membersPerCell[m.cell_id] || 0) + 1
    }
  }

  // Query 3: Get last meeting for each cell with report status
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: lastMeetings } = await supabase
    .from('cell_meetings')
    .select(`
      id,
      cell_id,
      date,
      cell_reports(id)
    `)
    .in('cell_id', cellIds)
    .order('date', { ascending: false })

  // Group last meeting by cell
  const lastMeetingPerCell: Record<string, { id: string; date: string; hasReport: boolean }> = {}
  for (const meeting of lastMeetings || []) {
    if (!lastMeetingPerCell[meeting.cell_id]) {
      lastMeetingPerCell[meeting.cell_id] = {
        id: meeting.id,
        date: meeting.date,
        hasReport: Array.isArray(meeting.cell_reports) && meeting.cell_reports.length > 0
      }
    }
  }

  // Query 4: Get all recent meetings (last 4 per cell) for attendance calculation
  const { data: recentMeetings } = await supabase
    .from('cell_meetings')
    .select('id, cell_id')
    .in('cell_id', cellIds)
    .order('date', { ascending: false })
    .limit(cellIds.length * 4)

  // Get meeting IDs
  const meetingIds = (recentMeetings || []).map(m => m.id)

  // Query 5: Get attendance for all meetings in one query
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('context_id, status')
    .eq('context_type', 'CELL_MEETING')
    .in('context_id', meetingIds.length > 0 ? meetingIds : ['none'])

  // Calculate attendance per cell
  const meetingToCellMap: Record<string, string> = {}
  for (const meeting of recentMeetings || []) {
    meetingToCellMap[meeting.id] = meeting.cell_id
  }

  const attendancePerCell: Record<string, { present: number; total: number }> = {}
  for (const attendance of allAttendance || []) {
    const cellId = meetingToCellMap[attendance.context_id]
    if (cellId) {
      if (!attendancePerCell[cellId]) {
        attendancePerCell[cellId] = { present: 0, total: 0 }
      }
      attendancePerCell[cellId].total++
      if (attendance.status === 'PRESENT') {
        attendancePerCell[cellId].present++
      }
    }
  }

  // Query 6: Get pending requests count
  const { count: pendingRequests } = await supabase
    .from('cell_requests')
    .select('*', { count: 'exact', head: true })
    .in('cell_id', cellIds)
    .eq('status', 'PENDING')

  // Build result
  const supervisedCells: SupervisedCell[] = []
  const alerts: Alert[] = []
  let totalMembers = 0
  let totalPresent = 0
  let totalAttendees = 0
  let cellsWithoutReports = 0

  for (const item of supervision) {
    const cell = item.cells as unknown as {
      id: string
      name: string
      status: string
      leader_id: string
      leader: {
        id: string
        full_name: string
        phone: string | null
        email: string | null
        photo_url: string | null
      }
    }

    const membersCount = membersPerCell[cell.id] || 0
    totalMembers += membersCount

    const lastMeeting = lastMeetingPerCell[cell.id]
    const hasRecentReport = lastMeeting?.hasReport || false

    // Check for alerts
    if (lastMeeting && !hasRecentReport) {
      const lastMeetingDate = new Date(lastMeeting.date)
      if (lastMeetingDate < oneWeekAgo) {
        cellsWithoutReports++
        alerts.push({
          id: `no_report_${cell.id}`,
          type: 'no_report',
          cellId: cell.id,
          cellName: cell.name,
          message: `${cell.name} não enviou relatório da última reunião`,
          severity: 'warning',
          createdAt: new Date().toISOString()
        })
      }
    }

    // Calculate attendance
    const cellAttendance = attendancePerCell[cell.id] || { present: 0, total: 0 }
    const avgAttendance = cellAttendance.total > 0
      ? Math.round((cellAttendance.present / cellAttendance.total) * 100)
      : 0

    totalPresent += cellAttendance.present
    totalAttendees += cellAttendance.total

    // Alert for low attendance
    if (avgAttendance < MIN_ATTENDANCE_THRESHOLD && avgAttendance > 0) {
      alerts.push({
        id: `low_attendance_${cell.id}`,
        type: 'low_attendance',
        cellId: cell.id,
        cellName: cell.name,
        message: `${cell.name} está com presença de ${avgAttendance}% (abaixo de ${MIN_ATTENDANCE_THRESHOLD}%)`,
        severity: avgAttendance < 40 ? 'critical' : 'warning',
        createdAt: new Date().toISOString()
      })
    }

    supervisedCells.push({
      id: cell.id,
      name: cell.name,
      leaderId: cell.leader_id,
      leaderName: cell.leader?.full_name || 'Sem líder',
      leaderPhone: cell.leader?.phone || null,
      leaderEmail: cell.leader?.email || null,
      leaderPhotoUrl: cell.leader?.photo_url || null,
      membersCount,
      lastMeetingDate: lastMeeting?.date || null,
      hasRecentReport,
      avgAttendance,
      status: cell.status as 'ACTIVE' | 'INACTIVE'
    })
  }

  const overallAttendance = totalAttendees > 0
    ? Math.round((totalPresent / totalAttendees) * 100)
    : 0

  return {
    stats: {
      totalSupervisedCells: supervisedCells.length,
      totalMembers,
      overallAttendance,
      cellsWithoutReports,
      leadersCount: supervisedCells.length,
      pendingRequests: pendingRequests || 0
    },
    supervisedCells,
    recentAlerts: alerts.slice(0, 10)
  }
}

// =====================================================
// CELL DETAILS (with church_id verification)
// =====================================================

export async function getSupervisedCellDetails(cellId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(cellId)
  if (!parseResult.success) {
    console.error('Invalid cellId:', parseResult.error)
    return null
  }

  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Verify supervision with church_id check
  const { data: supervision } = await supabase
    .from('cell_supervision')
    .select('id')
    .eq('cell_id', cellId)
    .eq('discipulador_id', profile.id)
    .eq('church_id', profile.church_id)
    .single()

  // Allow pastor to view any cell IN THEIR CHURCH
  if (!supervision && profile.role !== 'PASTOR') {
    return null
  }

  // Get cell details WITH church_id verification
  const { data: cell } = await supabase
    .from('cells')
    .select(`
      *,
      leader:profiles!cells_leader_id_fkey(
        id,
        full_name,
        phone,
        email,
        photo_url
      )
    `)
    .eq('id', cellId)
    .eq('church_id', profile.church_id) // Security: verify church_id
    .single()

  if (!cell) return null

  // Get members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email, photo_url, member_stage')
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id) // Security: verify church_id
    .eq('is_active', true)
    .order('full_name')

  // Get recent meetings
  const { data: meetings } = await supabase
    .from('cell_meetings')
    .select(`
      id,
      date,
      status,
      cell_reports(id, created_at)
    `)
    .eq('cell_id', cellId)
    .order('date', { ascending: false })
    .limit(10)

  // Get goals
  const { data: goals } = await supabase
    .from('cell_goals')
    .select('*')
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id) // Security: verify church_id
    .eq('is_active', true)

  // Get notes
  const { data: notes } = await supabase
    .from('supervision_notes')
    .select('*')
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id) // Security: verify church_id
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    cell,
    members: members || [],
    meetings: meetings || [],
    goals: goals || [],
    notes: notes || []
  }
}

// =====================================================
// SUPERVISION NOTES (with validation)
// =====================================================

export async function addSupervisionNote(
  cellId: string,
  note: string,
  noteType: 'FEEDBACK' | 'CONCERN' | 'PRAISE' | 'ACTION_ITEM' = 'FEEDBACK',
  isPrivate: boolean = false
) {
  // Validate input
  const parseResult = noteSchema.safeParse({ cellId, note, noteType, isPrivate })
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const profile = await getProfile()
  if (!profile || (profile.role !== 'DISCIPULADOR' && profile.role !== 'PASTOR')) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Verify supervision (unless pastor)
  if (profile.role === 'DISCIPULADOR') {
    const { data: supervision } = await supabase
      .from('cell_supervision')
      .select('id')
      .eq('cell_id', cellId)
      .eq('discipulador_id', profile.id)
      .eq('church_id', profile.church_id)
      .single()

    if (!supervision) {
      throw new Error('Você não supervisiona esta célula')
    }
  }

  // Verify cell belongs to church (for pastor)
  if (profile.role === 'PASTOR') {
    const { data: cell } = await supabase
      .from('cells')
      .select('id')
      .eq('id', cellId)
      .eq('church_id', profile.church_id)
      .single()

    if (!cell) {
      throw new Error('Célula não encontrada')
    }
  }

  const { error } = await supabase
    .from('supervision_notes')
    .insert({
      church_id: profile.church_id,
      cell_id: cellId,
      discipulador_id: profile.id,
      note,
      note_type: noteType,
      is_private: isPrivate
    })

  if (error) {
    console.error('Error adding note:', error)
    throw new Error('Erro ao adicionar anotação')
  }

  revalidatePath(`/supervisao/celulas/${cellId}`)
  return { success: true }
}

export async function deleteSupervisionNote(noteId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(noteId)
  if (!parseResult.success) {
    throw new Error('ID da nota inválido')
  }

  const profile = await getProfile()
  if (!profile) throw new Error('Não autenticado')

  const supabase = await createClient()

  const { error } = await supabase
    .from('supervision_notes')
    .delete()
    .eq('id', noteId)
    .eq('discipulador_id', profile.id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting note:', error)
    throw new Error('Erro ao excluir anotação')
  }

  revalidatePath('/supervisao')
  return { success: true }
}

// =====================================================
// CELL REQUESTS (Approve/Reject)
// =====================================================

export async function approveCellRequestAsDiscipulador(requestId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(requestId)
  if (!parseResult.success) {
    throw new Error('ID da solicitação inválido')
  }

  const profile = await getProfile()
  if (!profile || (profile.role !== 'DISCIPULADOR' && profile.role !== 'PASTOR')) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get the request with church_id verification
  const { data: request } = await supabase
    .from('cell_requests')
    .select('*, cell:cells(id, name, church_id)')
    .eq('id', requestId)
    .single()

  if (!request) {
    throw new Error('Solicitação não encontrada')
  }

  // Security: verify cell belongs to user's church
  const cellData = request.cell as unknown as { id: string; name: string; church_id: string }
  if (cellData?.church_id !== profile.church_id) {
    throw new Error('Acesso não autorizado')
  }

  // Verify supervision (unless pastor)
  if (profile.role === 'DISCIPULADOR') {
    const { data: supervision } = await supabase
      .from('cell_supervision')
      .select('id')
      .eq('cell_id', request.cell_id)
      .eq('discipulador_id', profile.id)
      .eq('church_id', profile.church_id)
      .single()

    if (!supervision) {
      throw new Error('Você não supervisiona esta célula')
    }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('cell_requests')
    .update({
      status: 'APPROVED',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (updateError) {
    throw new Error('Erro ao aprovar solicitação')
  }

  // Update member's cell_id and member_stage
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      cell_id: request.cell_id,
      member_stage: 'MEMBER'
    })
    .eq('id', request.profile_id)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  revalidatePath('/supervisao')
  return { success: true }
}

export async function rejectCellRequestAsDiscipulador(requestId: string, reason?: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(requestId)
  if (!parseResult.success) {
    throw new Error('ID da solicitação inválido')
  }

  const profile = await getProfile()
  if (!profile || (profile.role !== 'DISCIPULADOR' && profile.role !== 'PASTOR')) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get the request with church_id verification
  const { data: request } = await supabase
    .from('cell_requests')
    .select('cell_id, cells!inner(church_id)')
    .eq('id', requestId)
    .single()

  if (!request) {
    throw new Error('Solicitação não encontrada')
  }

  // Security: verify cell belongs to user's church
  const cellData = request.cells as unknown as { church_id: string }
  if (cellData?.church_id !== profile.church_id) {
    throw new Error('Acesso não autorizado')
  }

  // Verify supervision (unless pastor)
  if (profile.role === 'DISCIPULADOR') {
    const { data: supervision } = await supabase
      .from('cell_supervision')
      .select('id')
      .eq('cell_id', request.cell_id)
      .eq('discipulador_id', profile.id)
      .eq('church_id', profile.church_id)
      .single()

    if (!supervision) {
      throw new Error('Você não supervisiona esta célula')
    }
  }

  const { error } = await supabase
    .from('cell_requests')
    .update({
      status: 'REJECTED',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason?.slice(0, 500) // Limit reason length
    })
    .eq('id', requestId)

  if (error) {
    throw new Error('Erro ao rejeitar solicitação')
  }

  revalidatePath('/supervisao')
  return { success: true }
}

// =====================================================
// GET PENDING REQUESTS
// =====================================================

export async function getPendingRequestsForDiscipulador() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'DISCIPULADOR') return []

  const supabase = await createClient()

  // Get supervised cell IDs with church_id verification
  const { data: supervision } = await supabase
    .from('cell_supervision')
    .select('cell_id')
    .eq('discipulador_id', profile.id)
    .eq('church_id', profile.church_id)

  if (!supervision || supervision.length === 0) return []

  const cellIds = supervision.map(s => s.cell_id)

  // Get pending requests
  const { data: requests } = await supabase
    .from('cell_requests')
    .select(`
      id,
      message,
      created_at,
      cell:cells(id, name),
      profile:profiles!cell_requests_profile_id_fkey(
        id,
        full_name,
        email,
        phone,
        photo_url
      )
    `)
    .in('cell_id', cellIds)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  return requests || []
}

// =====================================================
// LEADERS LIST
// =====================================================

export async function getSupervisedLeaders() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'DISCIPULADOR') return []

  const supabase = await createClient()

  const { data: supervision } = await supabase
    .from('cell_supervision')
    .select(`
      cell_id,
      assigned_at,
      cells!inner(
        id,
        name,
        status,
        leader:profiles!cells_leader_id_fkey(
          id,
          full_name,
          phone,
          email,
          photo_url,
          member_stage
        )
      )
    `)
    .eq('discipulador_id', profile.id)
    .eq('church_id', profile.church_id)

  return supervision?.map(s => ({
    cellId: s.cell_id,
    cellName: (s.cells as unknown as { name: string }).name,
    cellStatus: (s.cells as unknown as { status: string }).status,
    assignedAt: s.assigned_at,
    leader: (s.cells as unknown as { leader: unknown }).leader
  })) || []
}

// =====================================================
// EMERGENCY REPORT SUBMISSION (with validation)
// =====================================================

export async function submitEmergencyReport(
  meetingId: string,
  reportData: {
    had_icebreaker: boolean
    had_worship: boolean
    had_word: boolean
    had_prayer: boolean
    had_snack: boolean
    visitor_count: number
    decisions_count: number
    observations?: string
  }
) {
  // Validate input
  const parseResult = reportSchema.safeParse({
    meetingId,
    ...reportData
  })
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const profile = await getProfile()
  if (!profile || (profile.role !== 'DISCIPULADOR' && profile.role !== 'PASTOR')) {
    throw new Error('Acesso não autorizado')
  }

  const supabase = await createClient()

  // Get meeting with cell info and verify church
  const { data: meeting } = await supabase
    .from('cell_meetings')
    .select('id, cell_id, cells!inner(church_id)')
    .eq('id', meetingId)
    .single()

  if (!meeting) {
    throw new Error('Reunião não encontrada')
  }

  // Security: verify meeting belongs to user's church
  const cellData = meeting.cells as unknown as { church_id: string }
  if (cellData?.church_id !== profile.church_id) {
    throw new Error('Acesso não autorizado')
  }

  // Verify supervision (unless pastor)
  if (profile.role === 'DISCIPULADOR') {
    const { data: supervision } = await supabase
      .from('cell_supervision')
      .select('id')
      .eq('cell_id', meeting.cell_id)
      .eq('discipulador_id', profile.id)
      .eq('church_id', profile.church_id)
      .single()

    if (!supervision) {
      throw new Error('Você não supervisiona esta célula')
    }
  }

  // Check if report already exists
  const { data: existingReport } = await supabase
    .from('cell_reports')
    .select('id')
    .eq('meeting_id', meetingId)
    .single()

  if (existingReport) {
    throw new Error('Relatório já existe para esta reunião')
  }

  // Create report
  const { error } = await supabase
    .from('cell_reports')
    .insert({
      meeting_id: meetingId,
      submitted_by: profile.id,
      ...reportData,
      observations: reportData.observations
        ? `[Relatório de emergência por Discipulador] ${reportData.observations.slice(0, 1900)}`
        : '[Relatório de emergência submetido pelo Discipulador]'
    })

  if (error) {
    console.error('Error creating report:', error)
    throw new Error('Erro ao criar relatório')
  }

  revalidatePath('/supervisao')
  return { success: true }
}

// =====================================================
// GOALS
// =====================================================

export async function getCellGoals(cellId: string) {
  // Validate input
  const parseResult = uuidSchema.safeParse(cellId)
  if (!parseResult.success) {
    return []
  }

  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data: goals } = await supabase
    .from('cell_goals')
    .select('*')
    .eq('cell_id', cellId)
    .eq('church_id', profile.church_id) // Security: verify church_id
    .eq('is_active', true)

  return goals || []
}
