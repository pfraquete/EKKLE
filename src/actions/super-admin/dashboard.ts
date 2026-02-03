'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'

export interface DashboardStats {
    churches: {
        total: number
        active: number
        suspended: number
        thisMonth: number
        growth: number // percentage
    }
    subscriptions: {
        active: number
        canceled: number
        trialing: number
        mrr: number // Monthly Recurring Revenue in cents
        arr: number // Annual Recurring Revenue in cents
    }
    users: {
        total: number
        thisMonth: number
        byRole: {
            pastors: number
            discipuladores: number
            leaders: number
            members: number
        }
    }
    alerts: {
        critical: number
        warning: number
        info: number
        unresolved: number
    }
    integrations: {
        healthy: number
        degraded: number
        down: number
        total: number
    }
}

export interface RevenueDataPoint {
    month: string
    revenue: number
    subscriptions: number
}

export interface GrowthDataPoint {
    month: string
    churches: number
    users: number
}

/**
 * Get all dashboard statistics for the super admin panel
 */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Run all queries in parallel
    const [
        churchesResult,
        churchesThisMonthResult,
        churchesLastMonthResult,
        subscriptionsResult,
        usersResult,
        usersThisMonthResult,
        usersByRoleResult,
        alertsResult,
        integrationsResult
    ] = await Promise.all([
        // Total churches by status
        supabase
            .from('churches')
            .select('status', { count: 'exact' }),

        // Churches created this month
        supabase
            .from('churches')
            .select('id', { count: 'exact' })
            .gte('created_at', startOfMonth.toISOString()),

        // Churches created last month (for growth calculation)
        supabase
            .from('churches')
            .select('id', { count: 'exact' })
            .gte('created_at', startOfLastMonth.toISOString())
            .lte('created_at', endOfLastMonth.toISOString()),

        // Subscriptions
        supabase
            .from('subscriptions')
            .select('status, plan_id, plans(price_monthly, price_yearly, billing_period)'),

        // Total users
        supabase
            .from('profiles')
            .select('id', { count: 'exact' }),

        // Users created this month
        supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .gte('created_at', startOfMonth.toISOString()),

        // Users by role
        supabase
            .from('profiles')
            .select('role'),

        // Alerts
        supabase
            .from('system_alerts')
            .select('alert_type, is_resolved'),

        // Integrations
        supabase
            .from('integration_status')
            .select('status')
    ])

    // Process churches data
    const churches = churchesResult.data || []
    const activeChurches = churches.filter(c => c.status === 'active' || !c.status).length
    const suspendedChurches = churches.filter(c => c.status === 'suspended').length
    const churchesThisMonth = churchesThisMonthResult.count || 0
    const churchesLastMonth = churchesLastMonthResult.count || 0
    const churchGrowth = churchesLastMonth > 0
        ? ((churchesThisMonth - churchesLastMonth) / churchesLastMonth) * 100
        : churchesThisMonth > 0 ? 100 : 0

    // Process subscriptions data
    const subscriptions = subscriptionsResult.data || []
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
    const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled').length
    const trialingSubscriptions = subscriptions.filter(s => s.status === 'trialing').length

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0
    subscriptions
        .filter(s => s.status === 'active')
        .forEach(sub => {
            const plan = sub.plans as any
            if (plan) {
                if (plan.billing_period === 'yearly') {
                    mrr += (plan.price_yearly || 0) / 12
                } else {
                    mrr += plan.price_monthly || 0
                }
            }
        })

    // Process users data
    const totalUsers = usersResult.count || 0
    const usersThisMonth = usersThisMonthResult.count || 0
    const userRoles = usersByRoleResult.data || []
    const pastors = userRoles.filter(u => u.role === 'PASTOR').length
    const discipuladores = userRoles.filter(u => u.role === 'DISCIPULADOR').length
    const leaders = userRoles.filter(u => u.role === 'LEADER').length
    const members = userRoles.filter(u => u.role === 'MEMBER').length

    // Process alerts data
    const alerts = alertsResult.data || []
    const unresolvedAlerts = alerts.filter(a => !a.is_resolved)
    const criticalAlerts = unresolvedAlerts.filter(a => a.alert_type === 'critical').length
    const warningAlerts = unresolvedAlerts.filter(a => a.alert_type === 'warning').length
    const infoAlerts = unresolvedAlerts.filter(a => a.alert_type === 'info').length

    // Process integrations data
    const integrations = integrationsResult.data || []
    const healthyIntegrations = integrations.filter(i => i.status === 'healthy').length
    const degradedIntegrations = integrations.filter(i => i.status === 'degraded').length
    const downIntegrations = integrations.filter(i => i.status === 'down').length

    return {
        churches: {
            total: churches.length,
            active: activeChurches,
            suspended: suspendedChurches,
            thisMonth: churchesThisMonth,
            growth: Math.round(churchGrowth * 10) / 10
        },
        subscriptions: {
            active: activeSubscriptions,
            canceled: canceledSubscriptions,
            trialing: trialingSubscriptions,
            mrr: Math.round(mrr),
            arr: Math.round(mrr * 12)
        },
        users: {
            total: totalUsers,
            thisMonth: usersThisMonth,
            byRole: {
                pastors,
                discipuladores,
                leaders,
                members
            }
        },
        alerts: {
            critical: criticalAlerts,
            warning: warningAlerts,
            info: infoAlerts,
            unresolved: unresolvedAlerts.length
        },
        integrations: {
            healthy: healthyIntegrations,
            degraded: degradedIntegrations,
            down: downIntegrations,
            total: integrations.length
        }
    }
}

/**
 * Get revenue metrics for the last 12 months
 */
export async function getRevenueMetrics(): Promise<RevenueDataPoint[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const months: RevenueDataPoint[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        // For now, return placeholder data
        // In production, this would query actual subscription/payment data
        months.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            revenue: 0, // Would be calculated from actual payments
            subscriptions: 0 // Would be counted from subscriptions table
        })
    }

    // Get actual subscription data
    const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, created_at, plans(price_monthly, price_yearly, billing_period)')
        .eq('status', 'active')

    if (subscriptions) {
        // Calculate current month's data
        const currentMonth = months[months.length - 1]
        currentMonth.subscriptions = subscriptions.length

        let totalRevenue = 0
        subscriptions.forEach(sub => {
            const plan = sub.plans as any
            if (plan) {
                totalRevenue += plan.billing_period === 'yearly'
                    ? plan.price_yearly || 0
                    : plan.price_monthly || 0
            }
        })
        currentMonth.revenue = totalRevenue
    }

    return months
}

/**
 * Get growth metrics for the last 12 months
 */
export async function getGrowthMetrics(): Promise<GrowthDataPoint[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const months: GrowthDataPoint[] = []
    const now = new Date()

    // Get cumulative counts for each month
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i + 1, 0) // End of month

        const [churchCount, userCount] = await Promise.all([
            supabase
                .from('churches')
                .select('id', { count: 'exact', head: true })
                .lte('created_at', date.toISOString()),
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .lte('created_at', date.toISOString())
        ])

        months.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            churches: churchCount.count || 0,
            users: userCount.count || 0
        })
    }

    return months
}

/**
 * Get recent activity for the dashboard widget
 */
export async function getRecentActivity(limit: number = 10) {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get recent churches
    const { data: recentChurches } = await supabase
        .from('churches')
        .select('id, name, created_at, logo_url')
        .order('created_at', { ascending: false })
        .limit(5)

    // Get recent audit logs
    const { data: recentAuditRaw } = await supabase
        .from('admin_audit_logs')
        .select(`
            id,
            action,
            target_type,
            created_at,
            admin:profiles!admin_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    // Transform audit data to flatten admin
    const recentAudit = (recentAuditRaw || []).map(log => ({
        ...log,
        admin: Array.isArray(log.admin) ? log.admin[0] : log.admin
    }))

    // Get unresolved alerts
    const { data: unresolvedAlerts } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        recentChurches: recentChurches || [],
        recentAudit: recentAudit || [],
        unresolvedAlerts: unresolvedAlerts || []
    }
}
