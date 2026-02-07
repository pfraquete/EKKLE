'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

import type { GrowthData, DashboardExtendedStats, DashboardStats, CellOverview } from './admin'

/**
 * OPTIMIZED: Get growth data with 2 queries instead of 24.
 * Instead of 4 count queries per month x 6 months = 24 queries,
 * we fetch all profiles/members created in the last 6 months in 2 queries
 * and aggregate in JavaScript.
 */
export async function getGrowthDataOptimized(): Promise<GrowthData[]> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    // Only 2 queries instead of 24
    const [profilesRes, membersRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('member_stage, created_at')
            .eq('church_id', churchId)
            .gte('created_at', startDate),
        supabase
            .from('members')
            .select('member_stage, created_at')
            .eq('church_id', churchId)
            .gte('created_at', startDate)
    ])

    const allRecords = [
        ...(profilesRes.data || []),
        ...(membersRes.data || [])
    ]

    // Aggregate by month in JavaScript
    const monthIndices = [5, 4, 3, 2, 1, 0]
    return monthIndices.map(i => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

        const monthRecords = allRecords.filter(r => {
            const created = new Date(r.created_at)
            return created >= monthStart && created <= monthEnd
        })

        const members = monthRecords.filter(r =>
            r.member_stage === 'MEMBER' || r.member_stage === 'LEADER'
        ).length

        const visitors = monthRecords.filter(r =>
            r.member_stage === 'VISITOR' || r.member_stage === 'REGULAR_VISITOR'
        ).length

        return { month: monthName, members, visitors }
    })
}

/**
 * OPTIMIZED: Get all dashboard data in a single function call.
 * Combines getPastorDashboardData + getExtendedDashboardStats into one,
 * sharing the profile and supabase client.
 */
export async function getDashboardDataCombined(): Promise<{
    stats: DashboardStats
    extendedStats: DashboardExtendedStats | null
}> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)

    // ALL queries in a single Promise.all - no sequential getProfile calls
    const [
        // Basic stats
        profilesCountRes,
        congregationCountRes,
        cellsCountRes,
        recentReportsRes,
        attendanceDataRes,
        // Extended stats
        totalCoursesRes,
        publishedCoursesRes,
        totalEnrollmentsRes,
        completedEnrollmentsRes,
        totalOrdersRes,
        paidOrdersRes,
        revenueDataRes,
        pendingOrdersRes,
        upcomingEventsRes,
        totalRegistrationsRes
    ] = await Promise.all([
        // Basic dashboard
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
            .eq('church_id', churchId),
        supabase
            .from('cell_reports')
            .select('meeting_id')
            .eq('church_id', churchId)
            .gte('created_at', lastWeek.toISOString()),
        supabase
            .from('attendance')
            .select('status')
            .eq('church_id', churchId)
            .gte('context_date', lastMonth.toISOString().split('T')[0]),
        // Extended stats - courses
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId),
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('is_published', true),
        supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId),
        supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .not('completed_at', 'is', null),
        // Extended stats - orders
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('payment_status', 'paid'),
        supabase
            .from('orders')
            .select('total_cents')
            .eq('church_id', churchId)
            .eq('payment_status', 'paid'),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('payment_status', 'pending'),
        // Extended stats - events
        supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .gte('start_date', new Date().toISOString()),
        supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
    ])

    const totalMembers = (profilesCountRes.count || 0) + (congregationCountRes.count || 0)
    const cellsCount = cellsCountRes.count || 0

    // Cells without reports
    const reportedMeetingIds = recentReportsRes.data?.map(r => r.meeting_id) || []
    let distinctReportingCellsSize = 0
    if (reportedMeetingIds.length > 0) {
        const { data: recentMeetings } = await supabase
            .from('cell_meetings')
            .select('cell_id')
            .in('id', reportedMeetingIds)
        distinctReportingCellsSize = new Set(recentMeetings?.map(m => m.cell_id) || []).size
    }

    // Attendance
    const totalPossible = attendanceDataRes.data?.length || 0
    const totalPresent = attendanceDataRes.data?.filter(a => a.status === 'PRESENT').length || 0
    const overallAttendance = totalPossible === 0 ? 0 : Math.round((totalPresent / totalPossible) * 100)

    // Revenue
    const totalRevenueCents = revenueDataRes.data?.reduce((sum, order) => sum + order.total_cents, 0) || 0

    return {
        stats: {
            totalMembers,
            totalCells: cellsCount,
            overallAttendance,
            cellsWithoutReports: Math.max(0, cellsCount - distinctReportingCellsSize)
        },
        extendedStats: (profile.role === 'PASTOR' || profile.role === 'LEADER') ? {
            courses: {
                totalCourses: totalCoursesRes.count || 0,
                publishedCourses: publishedCoursesRes.count || 0,
                totalEnrollments: totalEnrollmentsRes.count || 0,
                completedEnrollments: completedEnrollmentsRes.count || 0,
            },
            orders: {
                totalOrders: totalOrdersRes.count || 0,
                paidOrders: paidOrdersRes.count || 0,
                totalRevenueCents,
                pendingOrders: pendingOrdersRes.count || 0,
            },
            events: {
                upcomingEvents: upcomingEventsRes.count || 0,
                totalRegistrations: totalRegistrationsRes.count || 0,
            }
        } : null
    }
}
