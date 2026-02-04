'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin-auth'

export interface ChurchStats {
    members: number
    cells: number
    events: number
    courses: number
    leaders: number
    discipuladores: number
    cellMeetings: number
    attendance: number
}

/**
 * Get detailed statistics for a church
 */
export async function getChurchStats(churchId: string): Promise<ChurchStats> {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Run all queries in parallel
    const [
        membersResult,
        cellsResult,
        eventsResult,
        coursesResult,
        leadersResult,
        discipuladoresResult,
        cellMeetingsResult,
        attendanceResult
    ] = await Promise.all([
        // Total members
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),

        // Total cells
        supabase
            .from('cells')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),

        // Total events
        supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),

        // Total courses
        supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),

        // Leaders count
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('role', 'LEADER'),

        // Discipuladores count
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('role', 'DISCIPULADOR'),

        // Cell meetings count
        supabase
            .from('cell_meetings')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),

        // Attendance records count
        supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId)
    ])

    return {
        members: membersResult.count || 0,
        cells: cellsResult.count || 0,
        events: eventsResult.count || 0,
        courses: coursesResult.count || 0,
        leaders: leadersResult.count || 0,
        discipuladores: discipuladoresResult.count || 0,
        cellMeetings: cellMeetingsResult.count || 0,
        attendance: attendanceResult.count || 0
    }
}
