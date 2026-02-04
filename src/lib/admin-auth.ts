/**
 * Super Admin Authentication Utilities
 * Helper functions for super admin authentication and audit logging
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AdminAction =
    | 'church.view'
    | 'church.update'
    | 'church.suspend'
    | 'church.reactivate'
    | 'church.delete'
    | 'subscription.view'
    | 'subscription.update'
    | 'subscription.cancel'
    | 'subscription.extend'
    | 'user.view'
    | 'user.update'
    | 'user.promote'
    | 'user.demote'
    | 'user.impersonate_start'
    | 'user.impersonate_end'
    | 'setting.view'
    | 'setting.update'
    | 'feature_flag.create'
    | 'feature_flag.update'
    | 'feature_flag.delete'
    | 'integration.check'
    | 'integration.configure'
    | 'webhook.retry'
    | 'alert.resolve'
    | 'alert.dismiss'
    | 'note.create'
    | 'note.update'
    | 'note.delete'
    | 'ticket.create'
    | 'ticket.update'
    | 'ticket.reply'
    | 'ticket.assign'
    | 'ticket.close'
    | 'communication.create'
    | 'communication.send'
    | 'communication.delete'
    | 'template.create'
    | 'template.update'
    | 'template.delete'

export type TargetType =
    | 'church'
    | 'subscription'
    | 'profile'
    | 'setting'
    | 'feature_flag'
    | 'integration'
    | 'webhook'
    | 'alert'
    | 'note'
    | 'impersonation'
    | 'ticket'
    | 'communication'
    | 'template'

export interface AdminProfile {
    id: string
    email: string
    full_name: string | null
    role: 'SUPER_ADMIN'
    avatar_url: string | null
    created_at: string
}

/**
 * Check if the current user is a super admin
 * Returns true if user has SUPER_ADMIN role, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return false
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role === 'SUPER_ADMIN'
}

/**
 * Require super admin authentication
 * Redirects to login if not authenticated, or to dashboard if not a super admin
 * Returns the admin profile if authorized
 */
export async function requireSuperAdmin(): Promise<AdminProfile> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        redirect('/login')
    }

    if (profile.role !== 'SUPER_ADMIN') {
        redirect('/dashboard')
    }

    return profile as AdminProfile
}

/**
 * Get the current super admin profile without redirecting
 * Returns null if not authenticated or not a super admin
 */
export async function getSuperAdminProfile(): Promise<AdminProfile | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'SUPER_ADMIN') {
        return null
    }

    return profile as AdminProfile
}

/**
 * Log an admin action to the audit trail
 * All super admin actions should be logged for accountability
 */
export async function logAdminAction(
    action: AdminAction,
    targetType: TargetType,
    options?: {
        targetId?: string
        churchId?: string
        oldValue?: Record<string, unknown>
        newValue?: Record<string, unknown>
        reason?: string
    }
): Promise<string | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('[Admin Audit] Cannot log action: No authenticated user')
        return null
    }

    const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert({
            admin_id: user.id,
            action,
            target_type: targetType,
            target_id: options?.targetId,
            church_id: options?.churchId,
            old_value: options?.oldValue,
            new_value: options?.newValue,
            reason: options?.reason,
        })
        .select('id')
        .single()

    if (error) {
        console.error('[Admin Audit] Failed to log action:', error)
        return null
    }

    return data.id
}

/**
 * Helper to check if a feature flag is enabled
 */
export async function isFeatureFlagEnabled(
    flagName: string,
    options?: {
        churchId?: string
        planId?: string
    }
): Promise<boolean> {
    const supabase = await createClient()

    const { data: flag } = await supabase
        .from('feature_flags')
        .select('is_enabled, scope, church_ids, plan_ids')
        .eq('name', flagName)
        .single()

    if (!flag || !flag.is_enabled) {
        return false
    }

    // Global scope - enabled for everyone
    if (flag.scope === 'global') {
        return true
    }

    // Church-specific scope
    if (flag.scope === 'church' && options?.churchId) {
        return (flag.church_ids || []).includes(options.churchId)
    }

    // Plan-specific scope
    if (flag.scope === 'plan' && options?.planId) {
        return (flag.plan_ids || []).includes(options.planId)
    }

    return false
}

/**
 * Get an admin setting value
 */
export async function getAdminSetting<T = unknown>(key: string): Promise<T | null> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single()

    return data?.value as T | null
}

/**
 * Update an admin setting value
 * Requires super admin authentication
 */
export async function updateAdminSetting(
    key: string,
    value: unknown,
    reason?: string
): Promise<boolean> {
    const admin = await getSuperAdminProfile()

    if (!admin) {
        return false
    }

    const supabase = await createClient()

    // Get old value for audit
    const { data: oldSetting } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single()

    // Update or insert setting
    const { error } = await supabase
        .from('admin_settings')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString(),
        })

    if (error) {
        console.error('[Admin Settings] Failed to update:', error)
        return false
    }

    // Log the action
    await logAdminAction('setting.update', 'setting', {
        oldValue: { key, value: oldSetting?.value },
        newValue: { key, value },
        reason,
    })

    return true
}

/**
 * Create a system alert
 */
export async function createSystemAlert(
    alertType: 'critical' | 'warning' | 'info',
    category: string,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>
): Promise<string | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_alerts')
        .insert({
            alert_type: alertType,
            category,
            title,
            description,
            metadata,
        })
        .select('id')
        .single()

    if (error) {
        console.error('[System Alert] Failed to create:', error)
        return null
    }

    return data.id
}

/**
 * Get unresolved system alerts count by type
 */
export async function getUnresolvedAlertsCount(): Promise<{
    critical: number
    warning: number
    info: number
    total: number
}> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('system_alerts')
        .select('alert_type')
        .eq('is_resolved', false)

    const counts = {
        critical: 0,
        warning: 0,
        info: 0,
        total: 0,
    }

    if (data) {
        data.forEach(alert => {
            counts[alert.alert_type as keyof typeof counts]++
            counts.total++
        })
    }

    return counts
}
