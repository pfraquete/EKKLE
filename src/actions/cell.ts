'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

export interface MyCellData {
    cell: {
        id: string
        name: string
        address: string | null
        neighborhood: string | null
        dayOfWeek: number | null
        meetingTime: string | null
    }
    stats: {
        membersCount: number
        avgAttendance: number
    }
    members: {
        id: string
        fullName: string
        photoUrl: string | null
        consecutiveAbsences: number
    }[]
    recentMeetings: {
        id: string
        date: string
        presentCount: number
        hasReport: boolean
    }[]
    alerts: {
        type: 'absence' | 'no_report'
        message: string
        memberId?: string
    }[]
    activeMeeting: {
        id: string
        date: string
    } | null
}

export interface CellDetails {
    cell: {
        id: string
        name: string
        status: 'ACTIVE' | 'INACTIVE'
        address: string | null
        neighborhood: string | null
        dayOfWeek: number | null
        meetingTime: string | null
        leader: {
            id: string
            fullName: string
            photoUrl: string | null
        } | null
    }
    stats: {
        membersCount: number
        avgAttendance: number
    }
    members: {
        id: string
        fullName: string
        photoUrl: string | null
    }[]
    recentMeetings: {
        id: string
        date: string
        status: string
        presentCount: number
        hasReport: boolean
    }[]
}

interface CellMemberRow {
    id: string
    full_name: string
    photo_url: string | null
}

interface CellMeetingAttendance {
    status: string
}

interface CellMeetingRow {
    id: string
    date: string
    status: string
    report?: { id: string }[] | null
    attendance?: CellMeetingAttendance[] | null
}


interface AttendanceRow {
    profile_id: string
    status: string
    context_id: string
}

export async function getMyCellData(): Promise<MyCellData | null> {
    const profile = await getProfile()
    if (!profile) return null
    const profileId = profile.id
    const supabase = await createClient()

    // Find the cell where this user is the leader
    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .select('*')
        .eq('leader_id', profileId)
        .eq('status', 'ACTIVE')
        .maybeSingle()

    if (cellError || !cell) return null

    // Fetch data in parallel
    const [
        membersResponse,
        meetingsResponse,
        activeMeetingResponse
    ] = await Promise.all([
        // Group members
        supabase
            .from('profiles')
            .select('id, full_name, photo_url')
            .eq('cell_id', cell.id)
            .eq('is_active', true)
            .order('full_name'),

        // Last 5 meetings
        supabase
            .from('cell_meetings')
            .select(`
        id,
        date,
        status,
        report:cell_reports(id),
        attendance(status)
      `)
            .eq('cell_id', cell.id)
            .eq('status', 'COMPLETED')
            .order('date', { ascending: false })
            .limit(5),

        // Check for in-progress meeting
        supabase
            .from('cell_meetings')
            .select('id, date')
            .eq('cell_id', cell.id)
            .eq('status', 'IN_PROGRESS')
            .maybeSingle()
    ])

    // Process members and absences
    const members = (membersResponse.data || []) as CellMemberRow[]
    const meetings = (meetingsResponse.data || []) as CellMeetingRow[]
    const activeMeeting = (activeMeetingResponse.data || null) as { id: string; date: string } | null

    const memberIds = members.map(member => member.id)
    let memberAttendances: AttendanceRow[] = []

    if (memberIds.length > 0 && meetings.length > 0) {
        const meetingIds = meetings.map(meeting => meeting.id)
        const { data: att } = await supabase
            .from('attendance')
            .select('profile_id, status, context_id')
            .in('profile_id', memberIds)
            .in('context_id', meetingIds)
            .order('context_date', { ascending: false })
        memberAttendances = (att || []) as AttendanceRow[]
    }

    const processedMembers = members.map(member => {
        const memberAtts = memberAttendances.filter(a => a.profile_id === member.id)
        let consecutiveAbsences = 0
        for (const a of memberAtts) {
            if (a.status === 'ABSENT') {
                consecutiveAbsences++
            } else {
                break
            }
        }
        return {
            id: member.id,
            fullName: member.full_name,
            photoUrl: member.photo_url,
            consecutiveAbsences
        }
    })

    // Calculate avg attendance
    const totals = meetings.reduce(
        (acc, m) => {
            const attendance = m.attendance || []
            const present = attendance.filter(a => a.status === 'PRESENT').length
            const total = attendance.length
            return {
                present: acc.present + present,
                total: acc.total + total
            }
        },
        { present: 0, total: 0 }
    )
    const avgAttendance = totals.total === 0 ? 0 : Math.round((totals.present / totals.total) * 100)

    // Recent meetings summary
    const recentMeetings = meetings.map(m => ({
        id: m.id,
        date: m.date,
        presentCount: (m.attendance || []).filter(a => a.status === 'PRESENT').length,
        hasReport: (m.report?.length || 0) > 0
    }))

    // Alerts
    const alerts: MyCellData['alerts'] = []
    processedMembers.forEach(m => {
        if (m.consecutiveAbsences >= 2) {
            alerts.push({
                type: 'absence',
                message: `${m.fullName}: ${m.consecutiveAbsences} faltas seguidas`,
                memberId: m.id
            })
        }
    })

    return {
        cell: {
            id: cell.id,
            name: cell.name,
            address: cell.address,
            neighborhood: cell.neighborhood,
            dayOfWeek: cell.day_of_week,
            meetingTime: cell.meeting_time
        },
        stats: {
            membersCount: members.length,
            avgAttendance
        },
        members: processedMembers,
        recentMeetings,
        alerts,
        activeMeeting
    }
}

export async function getCellDetails(cellId: string): Promise<CellDetails | null> {
    const profile = await getProfile()
    if (!profile) return null
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .select(`
            id,
            name,
            status,
            address,
            neighborhood,
            day_of_week,
            meeting_time,
            leader_id,
            leader:profiles!leader_id(id, full_name, photo_url)
        `)
        .eq('id', cellId)
        .eq('church_id', churchId)
        .maybeSingle()

    if (cellError || !cell) return null

    const [membersResponse, meetingsResponse] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, photo_url')
            .eq('cell_id', cell.id)
            .eq('is_active', true)
            .order('full_name'),
        supabase
            .from('cell_meetings')
            .select(`
                id,
                date,
                status,
                report:cell_reports(id),
                attendance(status)
            `)
            .eq('cell_id', cell.id)
            .order('date', { ascending: false })
            .limit(8)
    ])

    const members = (membersResponse.data || []) as CellMemberRow[]
    const meetings = (meetingsResponse.data || []) as CellMeetingRow[]

    const totals = meetings.reduce(
        (acc, meeting) => {
            const attendance = meeting.attendance || []
            const present = attendance.filter(a => a.status === 'PRESENT').length
            const total = attendance.length
            return {
                present: acc.present + present,
                total: acc.total + total
            }
        },
        { present: 0, total: 0 }
    )

    const avgAttendance = totals.total === 0 ? 0 : Math.round((totals.present / totals.total) * 100)

    const recentMeetings = meetings.map(meeting => ({
        id: meeting.id,
        date: meeting.date,
        status: meeting.status,
        presentCount: (meeting.attendance || []).filter(a => a.status === 'PRESENT').length,
        hasReport: (meeting.report?.length || 0) > 0
    }))

    return {
        cell: {
            id: cell.id,
            name: cell.name,
            status: cell.status,
            address: cell.address,
            neighborhood: cell.neighborhood,
            dayOfWeek: cell.day_of_week,
            meetingTime: cell.meeting_time,
            leader: cell.leader
                ? {
                    id: (cell.leader as unknown as { id: string }).id,
                    fullName: (cell.leader as unknown as { full_name: string }).full_name,
                    photoUrl: (cell.leader as unknown as { photo_url: string | null }).photo_url
                }
                : null
        },
        stats: {
            membersCount: members.length,
            avgAttendance
        },
        members: members.map(member => ({
            id: member.id,
            fullName: member.full_name,
            photoUrl: member.photo_url
        })),
        recentMeetings
    }
}
