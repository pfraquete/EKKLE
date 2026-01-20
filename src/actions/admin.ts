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
    leaderName: string | null
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
    report: { id: string } | null
}

interface CellOverviewRow {
    id: string
    name: string
    status: 'ACTIVE' | 'INACTIVE'
    leader: { full_name: string | null } | null
    members: { id: string }[] | null
    meetings: CellMeetingRow[] | null
}

export async function getPastorDashboardData(churchId: string) {
    const supabase = await createClient()

    // 1. Total Members
    const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('is_active', true)

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
            totalMembers: membersCount || 0,
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
      members:profiles(id),
      meetings:cell_meetings(
        id,
        date,
        report:cell_reports(id)
      )
    `)
        .eq('church_id', churchId)
        .order('name')

    if (error) return []

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
            cell:cells(name)
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
