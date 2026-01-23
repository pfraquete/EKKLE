'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

export interface DashboardStats {
    totalMembers: number
    totalCells: number
    overallAttendance: number
    cellsWithoutReports: number
}

export interface CellOverview {
    id: string
    name: string
    leaderName: string
    membersCount: number
    lastMeetingDate: string | null
    status: 'ACTIVE' | 'INACTIVE'
    hasRecentReport: boolean
}

interface CellReportRow {
    meeting_id: string
}

interface CellMeetingRow {
    id: string
    date: string
    report: { id: string }[] | null
}

interface CellOverviewRow {
    id: string
    name: string
    status: 'ACTIVE' | 'INACTIVE'
    leader: { full_name: string | null }[] | null
    members: { id: string }[] | null
    meetings: CellMeetingRow[] | null
}

export async function getPastorDashboardData() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    // 1 & 2. Execute counts in parallel
    const [profilesCountRes, congregationCountRes, cellsCountRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('is_active', true),
        supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('is_active', true),
        supabase
            .from('cells')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
    ])

    const totalMembers = (profilesCountRes.count || 0) + (congregationCountRes.count || 0)
    const cellsCount = cellsCountRes.count || 0

    // 3. Cells with recent reports and Overall Attendance (can also be parallelized)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)

    const [recentReportsRes, attendanceDataRes] = await Promise.all([
        supabase
            .from('cell_reports')
            .select('meeting_id')
            .eq('church_id', churchId)
            .gte('created_at', lastWeek.toISOString()),
        supabase
            .from('attendance')
            .select('status')
            .eq('church_id', churchId)
            .gte('context_date', lastMonth.toISOString().split('T')[0])
    ])

    const recentReports = recentReportsRes.data
    const attendanceData = attendanceDataRes.data

    const reportedMeetingIds = recentReports?.map((report: CellReportRow) => report.meeting_id) || []

    let distinctReportingCellsSize = 0
    if (reportedMeetingIds.length > 0) {
        const { data: recentMeetings } = await supabase
            .from('cell_meetings')
            .select('cell_id')
            .in('id', reportedMeetingIds)

        const distinctReportingCells = new Set(recentMeetings?.map((meeting: { cell_id: string }) => meeting.cell_id) || [])
        distinctReportingCellsSize = distinctReportingCells.size
    }

    const cellsWithoutReports = cellsCount - distinctReportingCellsSize

    const totalPossible = attendanceData?.length || 0
    const totalPresent = attendanceData?.filter((attendance: { status: string }) => attendance.status === 'PRESENT').length || 0
    const overallAttendance = totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100)

    return {
        stats: {
            totalMembers: totalMembers,
            totalCells: cellsCount,
            overallAttendance,
            cellsWithoutReports: Math.max(0, cellsWithoutReports)
        }
    }
}

export async function getAllCellsOverview(): Promise<CellOverview[]> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data: cells, error } = await supabase
        .from('cells')
        .select(`
      id,
      name,
      status,
      leader:profiles!leader_id(full_name),
      members:profiles!profiles_cell_id_fkey(id),
      meetings:cell_meetings(
        id,
        date,
        report:cell_reports(id)
      )
    `)
        .eq('church_id', churchId)
        .order('name')

    if (error) {
        console.error('[getAllCellsOverview] Error fetching cells:', error)
        return []
    }

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    return ((cells || []) as CellOverviewRow[]).map(cell => {
        // Sort meetings by date desc
        const sortedMeetings = [...(cell.meetings || [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const lastMeeting = sortedMeetings[0]
        const hasRecentReport = sortedMeetings.some(meeting =>
            new Date(meeting.date) >= lastWeek && (meeting.report?.length ?? 0) > 0
        )
        const leaderName = cell.leader?.[0]?.full_name || 'Sem Líder'

        return {
            id: cell.id,
            name: cell.name,
            leaderName,
            membersCount: cell.members?.length || 0,
            lastMeetingDate: lastMeeting?.date || null,
            status: cell.status,
            hasRecentReport
        }
    })
}

export async function getChurchMembers() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            cell:cells!profiles_cell_id_fkey(name)
        `)
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('full_name')

    if (error) {
        console.error('Error fetching members:', error)
        return []
    }
    return data
}

export interface GrowthData {
    month: string
    members: number
    visitors: number
}

export async function getGrowthData(): Promise<GrowthData[]> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const now = new Date()
    const monthIndices = [5, 4, 3, 2, 1, 0]

    const monthDataPromises = monthIndices.map(async (i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]

        // Count members and visitors in parallel for each month
        const [
            profilesMemberCount,
            congregationMemberCount,
            profilesVisitorCount,
            congregationVisitorCount
        ] = await Promise.all([
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId)
                .in('member_stage', ['MEMBER', 'LEADER'])
                .gte('created_at', startDate)
                .lte('created_at', endDate),
            supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId)
                .in('member_stage', ['MEMBER', 'LEADER'])
                .gte('created_at', startDate)
                .lte('created_at', endDate),
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId)
                .in('member_stage', ['VISITOR', 'REGULAR_VISITOR'])
                .gte('created_at', startDate)
                .lte('created_at', endDate),
            supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId)
                .in('member_stage', ['VISITOR', 'REGULAR_VISITOR'])
                .gte('created_at', startDate)
                .lte('created_at', endDate)
        ])

        return {
            month: monthName,
            members: (profilesMemberCount.count || 0) + (congregationMemberCount.count || 0),
            visitors: (profilesVisitorCount.count || 0) + (congregationVisitorCount.count || 0)
        }
    })

    const months = await Promise.all(monthDataPromises)
    return months
}

export interface EventData {
    id: string
    title: string
    description: string | null
    location: string | null
    start_date: string
    end_time: string | null
    event_type: 'SERVICE' | 'EVENT' | 'COMMUNITY' | 'OTHER'
}

export async function getEvents(): Promise<EventData[]> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', churchId)
        .order('start_date', { ascending: true })

    if (error) {
        console.error('[getEvents] Error fetching events:', error)
        return []
    }

    return (data || []) as EventData[]
}

export async function createEvent(event: Omit<EventData, 'id'>) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, church_id: churchId }])
        .select()
        .single()

    if (error) {
        console.error('[createEvent] Error creating event:', error)
        throw new Error('Falha ao criar evento')
    }

    return data
}

export async function importMembers(members: Record<string, unknown>[]) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    // 1. Get existing cells to map names to IDs
    const { data: existingCells } = await supabase
        .from('cells')
        .select('id, name')
        .eq('church_id', churchId)

    const cellMap = new Map((existingCells || []).map(c => [c.name.toLowerCase(), c.id]))

    const results = {
        success: 0,
        errors: 0
    }

    // Fetch existing members to avoid duplicates
    const { data: currentMembers } = await supabase
        .from('members')
        .select('email, phone')
        .eq('church_id', churchId)

    const existingEmails = new Set(currentMembers?.map(m => m.email?.toLowerCase()).filter(Boolean))
    const existingPhones = new Set(currentMembers?.map(m => m.phone).filter(Boolean))

    // Process in batches of 50 to avoid timeouts/limits
    const batchSize = 50
    for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize)
        const toInsert = []

        for (const member of batch) {
            try {
                let cellId = null
                const cellNameField = (member.cell_name || member.celula || member.Célula || member.Cell) as string | undefined
                const cellName = cellNameField

                if (cellName) {
                    const normalizedCellName = cellName.trim().toLowerCase()
                    if (cellMap.has(normalizedCellName)) {
                        cellId = cellMap.get(normalizedCellName)
                    } else {
                        // Create new cell synchronously for the first one, then add to map
                        const { data: newCell } = await supabase
                            .from('cells')
                            .insert([{
                                name: cellName.trim(),
                                church_id: churchId,
                                status: 'ACTIVE'
                            }])
                            .select()
                            .single()

                        if (newCell) {
                            cellId = newCell.id
                            cellMap.set(normalizedCellName, cellId)
                        }
                    }
                }

                const memberStageField = (member.member_stage || member.estagio || member.estágio || 'MEMBER') as string
                const memberStage = memberStageField.toUpperCase()
                const validStages = ['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER']
                const finalStage = validStages.includes(memberStage) ? memberStage : 'MEMBER'

                const fullNameField = (member.full_name || member.Nome || member.nome || 'Membro Importado') as string
                const phoneField = (member.phone || member.telefone || member.Telefone || '') as string | number

                const email = (member.email as string)?.toLowerCase() || null
                const phone = String(phoneField)

                // Skip if duplicate email or phone (if present)
                if (email && existingEmails.has(email)) continue
                if (phone && existingPhones.has(phone)) continue

                toInsert.push({
                    full_name: fullNameField,
                    email: email,
                    phone: phone,
                    cell_id: cellId,
                    church_id: churchId,
                    member_stage: finalStage,
                    is_active: true
                })

                // Add to local sets to handle duplicates WITHIN the CSV
                if (email) existingEmails.add(email)
                if (phone) existingPhones.add(phone)
            } catch (e) {
                console.error('Error processing member in batch:', e)
                results.errors++
            }
        }

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('members')
                .insert(toInsert)

            if (error) {
                console.error('Error inserting batch:', error)
                results.errors += toInsert.length
            } else {
                results.success += toInsert.length
            }
        }
    }

    return results
}
