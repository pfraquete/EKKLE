'use server'

import { createClient } from '@/lib/supabase/server'

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

export async function getPastorDashboardData(churchId: string) {
    const supabase = await createClient()

    // 1. Total Members (from both profiles and members table)
    const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('is_active', true)

    const { count: congregationCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('is_active', true)

    const totalMembers = (profilesCount || 0) + (congregationCount || 0)

    // 2. Total Cells
    const { count: cellsCount } = await supabase
        .from('cells')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)

    // 3. Cells with recent reports (last 7 days)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const { data: recentReports } = await supabase
        .from('cell_reports')
        .select('meeting_id')
        .eq('church_id', churchId)
        .gte('created_at', lastWeek.toISOString())

    const reportedMeetingIds = recentReports?.map((report: CellReportRow) => report.meeting_id) || []

    const { data: recentMeetings } = await supabase
        .from('cell_meetings')
        .select('cell_id')
        .in('id', reportedMeetingIds)

    const distinctReportingCells = new Set(recentMeetings?.map((meeting: { cell_id: string }) => meeting.cell_id) || [])
    const cellsWithoutReports = (cellsCount || 0) - distinctReportingCells.size

    // 4. Overall Attendance (Last 4 weeks)
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)

    const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('church_id', churchId)
        .gte('context_date', lastMonth.toISOString().split('T')[0])

    const totalPossible = attendanceData?.length || 0
    const totalPresent = attendanceData?.filter((attendance: { status: string }) => attendance.status === 'PRESENT').length || 0
    const overallAttendance = totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100)

    return {
        stats: {
            totalMembers: totalMembers,
            totalCells: cellsCount || 0,
            overallAttendance,
            cellsWithoutReports: Math.max(0, cellsWithoutReports)
        }
    }
}

export async function getAllCellsOverview(churchId: string): Promise<CellOverview[]> {
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

export async function getChurchMembers(churchId: string) {
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

export async function getGrowthData(churchId: string): Promise<GrowthData[]> {
    const supabase = await createClient()

    // Get last 6 months of data
    const months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]

        // Count members created in this month (Profiles + Members table)
        const { count: profilesMemberCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .in('member_stage', ['MEMBER', 'LEADER'])
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        const { count: congregationMemberCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .in('member_stage', ['MEMBER', 'LEADER'])
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        // Count visitors in this month
        const { count: profilesVisitorCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .in('member_stage', ['VISITOR', 'REGULAR_VISITOR'])
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        const { count: congregationVisitorCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .in('member_stage', ['VISITOR', 'REGULAR_VISITOR'])
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        months.push({
            month: monthName,
            members: (profilesMemberCount || 0) + (congregationMemberCount || 0),
            visitors: (profilesVisitorCount || 0) + (congregationVisitorCount || 0)
        })
    }

    return months
}

export interface EventData {
    id: string
    title: string
    description: string | null
    location: string | null
    start_time: string
    end_time: string | null
    event_type: 'SERVICE' | 'EVENT' | 'COMMUNITY' | 'OTHER'
}

export async function getEvents(churchId: string): Promise<EventData[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', churchId)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('[getEvents] Error fetching events:', error)
        return []
    }

    return (data || []) as EventData[]
}

export async function createEvent(churchId: string, event: Omit<EventData, 'id'>) {
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

export async function importMembers(churchId: string, members: Record<string, unknown>[]) {
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

                toInsert.push({
                    full_name: fullNameField,
                    email: (member.email as string) || null,
                    phone: String(phoneField),
                    cell_id: cellId,
                    church_id: churchId,
                    member_stage: finalStage,
                    is_active: true
                })
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
