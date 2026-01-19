'use server'

import { createClient } from '@/lib/supabase/server'

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

export async function getMyCellData(profileId: string): Promise<MyCellData | null> {
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
        { data: members },
        { data: meetings },
        { data: activeMeeting }
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
    const memberIds = (members || []).map(m => m.id)
    let memberAttendances: any[] = []

    if (memberIds.length > 0 && (meetings || []).length > 0) {
        const meetingIds = (meetings || []).map(m => m.id)
        const { data: att } = await supabase
            .from('attendance')
            .select('profile_id, status, context_id')
            .in('profile_id', memberIds)
            .in('context_id', meetingIds)
            .order('context_date', { ascending: false })
        memberAttendances = att || []
    }

    const processedMembers = (members || []).map(member => {
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
    const totals = (meetings || []).reduce(
        (acc, m) => {
            const present = (m.attendance as any[])?.filter(a => a.status === 'PRESENT').length || 0
            const total = (m.attendance as any[])?.length || 0
            return {
                present: acc.present + present,
                total: acc.total + total
            }
        },
        { present: 0, total: 0 }
    )
    const avgAttendance = totals.total === 0 ? 0 : Math.round((totals.present / totals.total) * 100)

    // Recent meetings summary
    const recentMeetings = (meetings || []).map(m => ({
        id: m.id,
        date: m.date,
        presentCount: (m.attendance as any[])?.filter(a => a.status === 'PRESENT').length || 0,
        hasReport: !!m.report
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
            membersCount: members?.length || 0,
            avgAttendance
        },
        members: processedMembers.slice(0, 5),
        recentMeetings,
        alerts,
        activeMeeting: activeMeeting || null
    }
}
