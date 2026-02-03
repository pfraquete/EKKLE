'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin-auth'

export interface AuditLog {
    id: string
    admin_id: string
    action: string
    target_type: string
    target_id: string | null
    church_id: string | null
    old_value: Record<string, any> | null
    new_value: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    reason: string | null
    created_at: string
    admin?: {
        full_name: string
        email: string
    }
    church?: {
        name: string
    }
}

export interface AuditFilters {
    adminId?: string
    action?: string
    targetType?: string
    churchId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(filters: AuditFilters = {}) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const {
        adminId,
        action,
        targetType,
        churchId,
        startDate,
        endDate,
        page = 1,
        limit = 50
    } = filters
    const offset = (page - 1) * limit

    let query = supabase
        .from('admin_audit_logs')
        .select(`
            *,
            admin:profiles!admin_id(full_name, email),
            church:churches!church_id(name)
        `, { count: 'exact' })

    // Apply filters
    if (adminId) {
        query = query.eq('admin_id', adminId)
    }

    if (action) {
        query = query.eq('action', action)
    }

    if (targetType) {
        query = query.eq('target_type', targetType)
    }

    if (churchId) {
        query = query.eq('church_id', churchId)
    }

    if (startDate) {
        query = query.gte('created_at', startDate)
    }

    if (endDate) {
        query = query.lte('created_at', endDate)
    }

    // Apply pagination and ordering
    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
        console.error('[Super Admin] Failed to fetch audit logs:', error)
        throw new Error('Falha ao buscar logs de auditoria')
    }

    return {
        logs: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

/**
 * Get list of unique actions for filtering
 */
export async function getAuditActions(): Promise<string[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data } = await supabase
        .from('admin_audit_logs')
        .select('action')

    const actions = new Set<string>()
    data?.forEach(log => actions.add(log.action))

    return Array.from(actions).sort()
}

/**
 * Get list of unique target types for filtering
 */
export async function getAuditTargetTypes(): Promise<string[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data } = await supabase
        .from('admin_audit_logs')
        .select('target_type')

    const types = new Set<string>()
    data?.forEach(log => types.add(log.target_type))

    return Array.from(types).sort()
}

/**
 * Export audit logs as JSON
 */
export async function exportAuditLogs(filters: AuditFilters = {}) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { adminId, action, targetType, churchId, startDate, endDate } = filters

    let query = supabase
        .from('admin_audit_logs')
        .select(`
            *,
            admin:profiles!admin_id(full_name, email),
            church:churches!church_id(name)
        `)

    if (adminId) query = query.eq('admin_id', adminId)
    if (action) query = query.eq('action', action)
    if (targetType) query = query.eq('target_type', targetType)
    if (churchId) query = query.eq('church_id', churchId)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        throw new Error('Falha ao exportar logs')
    }

    return data || []
}

/**
 * Get audit statistics
 */
export async function getAuditStats() {
    await requireSuperAdmin()
    const supabase = await createClient()

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [last24hResult, last7dResult, last30dResult, byActionResult] = await Promise.all([
        supabase
            .from('admin_audit_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', last24h.toISOString()),
        supabase
            .from('admin_audit_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', last7d.toISOString()),
        supabase
            .from('admin_audit_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', last30d.toISOString()),
        supabase
            .from('admin_audit_logs')
            .select('action')
            .gte('created_at', last30d.toISOString())
    ])

    // Count by action
    const actionCounts: Record<string, number> = {}
    byActionResult.data?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    return {
        last24h: last24hResult.count || 0,
        last7d: last7dResult.count || 0,
        last30d: last30dResult.count || 0,
        byAction: actionCounts
    }
}

/**
 * Get system alerts
 */
export async function getSystemAlerts(filters: {
    resolved?: boolean
    type?: 'critical' | 'warning' | 'info'
    limit?: number
} = {}) {
    await requireSuperAdmin()
    const supabase = await createClient()

    let query = supabase
        .from('system_alerts')
        .select('*')

    if (filters.resolved !== undefined) {
        query = query.eq('is_resolved', filters.resolved)
    }

    if (filters.type) {
        query = query.eq('alert_type', filters.type)
    }

    query = query.order('created_at', { ascending: false })

    if (filters.limit) {
        query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('[Super Admin] Failed to fetch alerts:', error)
        return []
    }

    return data || []
}

/**
 * Resolve a system alert
 */
export async function resolveAlert(alertId: string) {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    const { error } = await supabase
        .from('system_alerts')
        .update({
            is_resolved: true,
            resolved_by: admin.id,
            resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

    if (error) {
        throw new Error('Falha ao resolver alerta')
    }

    return { success: true }
}
