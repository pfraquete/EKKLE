/**
 * Impersonation System for Admin Support
 *
 * Allows super admins to "login as" any user for support purposes.
 * All actions during impersonation are logged for audit.
 */

import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { logAdminAction } from '@/lib/admin-auth'

// Cookie name for impersonation token
export const IMPERSONATION_COOKIE = 'ekkle_impersonation'

// Secret for signing JWT (falls back to Supabase JWT secret)
const getImpersonationSecret = () => {
    const secret = process.env.IMPERSONATION_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!secret) {
        throw new Error('IMPERSONATION_SECRET or SUPABASE_JWT_SECRET must be set')
    }
    return new TextEncoder().encode(secret)
}

// Maximum session duration in hours
const MAX_SESSION_HOURS = 4

export interface ImpersonationSession {
    sessionId: string
    adminId: string
    adminEmail: string
    adminName: string | null
    targetUserId: string
    targetUserEmail: string
    targetUserName: string | null
    targetChurchId: string | null
    targetChurchName: string | null
    expiresAt: Date
    reason: string
    startedAt: Date
}

export interface ImpersonationPayload {
    sessionId: string
    adminId: string
    targetUserId: string
    targetChurchId: string | null
    exp: number
    iat: number
}

export interface StartImpersonationResult {
    success: boolean
    error?: string
    redirectUrl?: string
    session?: ImpersonationSession
}

/**
 * Start an impersonation session
 */
export async function startImpersonation(
    targetUserId: string,
    reason: string,
    options?: {
        ipAddress?: string
        userAgent?: string
    }
): Promise<StartImpersonationResult> {
    const supabase = await createClient()

    // Verify admin is super admin
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) {
        return { success: false, error: 'Não autenticado' }
    }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', adminUser.id)
        .single()

    if (!adminProfile || adminProfile.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Não autorizado' }
    }

    // Get target user info
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select(`
            id,
            email,
            full_name,
            church_id,
            role,
            church:churches(id, name, slug)
        `)
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) {
        return { success: false, error: 'Usuário não encontrado' }
    }

    // Prevent impersonating other super admins
    if (targetProfile.role === 'SUPER_ADMIN') {
        return { success: false, error: 'Não é possível impersonar outros super admins' }
    }

    // Check for existing active sessions
    const { data: existingSessions } = await supabase
        .from('impersonation_sessions')
        .select('id')
        .eq('admin_id', adminUser.id)
        .is('ended_at', null)
        .gt('expires_at', new Date().toISOString())

    if (existingSessions && existingSessions.length > 0) {
        return {
            success: false,
            error: 'Você já está em uma sessão de impersonação. Encerre a sessão atual primeiro.'
        }
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + MAX_SESSION_HOURS * 60 * 60 * 1000)

    // Generate a unique session token placeholder
    const tempToken = crypto.randomUUID()

    // Create session in database
    const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .insert({
            admin_id: adminUser.id,
            target_user_id: targetUserId,
            target_church_id: targetProfile.church_id,
            session_token: tempToken,
            expires_at: expiresAt.toISOString(),
            reason,
            ip_address: options?.ipAddress,
            user_agent: options?.userAgent,
        })
        .select('id')
        .single()

    if (sessionError || !session) {
        console.error('[Impersonation] Failed to create session:', sessionError)
        return { success: false, error: 'Falha ao criar sessão' }
    }

    // Generate signed JWT token
    const token = await new SignJWT({
        sessionId: session.id,
        adminId: adminUser.id,
        targetUserId,
        targetChurchId: targetProfile.church_id,
    } as Omit<ImpersonationPayload, 'exp' | 'iat'>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(getImpersonationSecret())

    // Update session with actual token
    await supabase
        .from('impersonation_sessions')
        .update({ session_token: token })
        .eq('id', session.id)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    })

    // Log the action
    await logAdminAction('user.impersonate_start' as any, 'profile', {
        targetId: targetUserId,
        churchId: targetProfile.church_id || undefined,
        newValue: {
            session_id: session.id,
            reason,
            expires_at: expiresAt.toISOString(),
            target_email: targetProfile.email,
            target_name: targetProfile.full_name,
        },
    })

    // Determine redirect URL based on target user's role and church
    let redirectUrl = '/dashboard'
    if (!targetProfile.church_id) {
        redirectUrl = '/ekkle/membro'
    } else if (targetProfile.role === 'MEMBER') {
        redirectUrl = '/membro'
    } else if (targetProfile.role === 'LEADER') {
        redirectUrl = '/membro'
    }

    const church = Array.isArray(targetProfile.church)
        ? targetProfile.church[0] ?? null
        : targetProfile.church ?? null

    return {
        success: true,
        redirectUrl,
        session: {
            sessionId: session.id,
            adminId: adminUser.id,
            adminEmail: adminProfile.email,
            adminName: adminProfile.full_name,
            targetUserId,
            targetUserEmail: targetProfile.email,
            targetUserName: targetProfile.full_name,
            targetChurchId: targetProfile.church_id,
            targetChurchName: church?.name || null,
            expiresAt,
            reason,
            startedAt: now,
        }
    }
}

/**
 * Get current impersonation session from cookie
 */
export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(IMPERSONATION_COOKIE)?.value

    if (!token) {
        return null
    }

    try {
        // Verify JWT
        const { payload } = await jwtVerify(token, getImpersonationSecret())
        const impersonationPayload = payload as unknown as ImpersonationPayload

        // Verify session still exists and is active in database
        const supabase = await createClient()
        const { data: session } = await supabase
            .from('impersonation_sessions')
            .select(`
                id,
                admin_id,
                target_user_id,
                target_church_id,
                started_at,
                expires_at,
                reason,
                admin:profiles!admin_id(email, full_name),
                target:profiles!target_user_id(email, full_name),
                church:churches!target_church_id(name)
            `)
            .eq('id', impersonationPayload.sessionId)
            .is('ended_at', null)
            .single()

        if (!session) {
            // Session not found or already ended - clear cookie
            await clearImpersonationCookie()
            return null
        }

        // Check if expired
        if (new Date(session.expires_at) < new Date()) {
            // Session expired - end it and clear cookie
            await supabase.rpc('end_impersonation_session', {
                p_session_id: session.id,
                p_reason: 'expired'
            })
            await clearImpersonationCookie()
            return null
        }

        const admin = Array.isArray(session.admin)
            ? session.admin[0] ?? null
            : session.admin ?? null
        const target = Array.isArray(session.target)
            ? session.target[0] ?? null
            : session.target ?? null
        const church = Array.isArray(session.church)
            ? session.church[0] ?? null
            : session.church ?? null

        if (!admin || !target) {
            await clearImpersonationCookie()
            return null
        }

        return {
            sessionId: session.id,
            adminId: session.admin_id,
            adminEmail: admin.email,
            adminName: admin.full_name,
            targetUserId: session.target_user_id,
            targetUserEmail: target.email,
            targetUserName: target.full_name,
            targetChurchId: session.target_church_id,
            targetChurchName: church?.name || null,
            expiresAt: new Date(session.expires_at),
            reason: session.reason,
            startedAt: new Date(session.started_at),
        }
    } catch (error) {
        // Invalid token - clear cookie
        console.error('[Impersonation] Invalid token:', error)
        await clearImpersonationCookie()
        return null
    }
}

/**
 * Clear the impersonation cookie
 */
async function clearImpersonationCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(IMPERSONATION_COOKIE)
}

/**
 * End the current impersonation session
 */
export async function endImpersonation(
    reason: 'manual' | 'expired' | 'admin_logout' | 'forced' = 'manual'
): Promise<{ success: boolean; error?: string }> {
    const cookieStore = await cookies()
    const token = cookieStore.get(IMPERSONATION_COOKIE)?.value

    if (!token) {
        return { success: true } // No session to end
    }

    try {
        const { payload } = await jwtVerify(token, getImpersonationSecret())
        const impersonationPayload = payload as unknown as ImpersonationPayload

        const supabase = await createClient()

        // Get session details before ending (for audit log)
        const { data: session } = await supabase
            .from('impersonation_sessions')
            .select('target_user_id, target_church_id, actions_count')
            .eq('id', impersonationPayload.sessionId)
            .single()

        // End the session
        await supabase.rpc('end_impersonation_session', {
            p_session_id: impersonationPayload.sessionId,
            p_reason: reason
        })

        // Log the action
        await logAdminAction('user.impersonate_end' as any, 'profile', {
            targetId: session?.target_user_id,
            churchId: session?.target_church_id || undefined,
            newValue: {
                session_id: impersonationPayload.sessionId,
                reason,
                actions_performed: session?.actions_count || 0,
            },
        })
    } catch (error) {
        console.error('[Impersonation] Error ending session:', error)
        // Continue to clear cookie even if there's an error
    }

    // Clear cookie
    await clearImpersonationCookie()

    return { success: true }
}

/**
 * Log an action during impersonation
 */
export async function logImpersonationAction(
    actionType: string,
    actionPath: string,
    method?: string,
    payload?: Record<string, unknown>
): Promise<void> {
    const session = await getImpersonationSession()
    if (!session) return

    const supabase = await createClient()

    // Log the action
    await supabase
        .from('impersonation_action_logs')
        .insert({
            session_id: session.sessionId,
            action_type: actionType,
            action_path: actionPath,
            action_method: method,
            action_payload: payload,
        })

    // Increment action count
    await supabase.rpc('increment_impersonation_actions', {
        p_session_id: session.sessionId
    })
}

/**
 * Check if currently impersonating (lightweight check using cookie)
 */
export async function isImpersonating(): Promise<boolean> {
    const cookieStore = await cookies()
    return cookieStore.has(IMPERSONATION_COOKIE)
}

/**
 * Get impersonation session data for client-side use (safe to expose)
 */
export async function getImpersonationClientData(): Promise<{
    isImpersonating: boolean
    adminEmail?: string
    adminName?: string | null
    targetEmail?: string
    targetName?: string | null
    targetChurchName?: string | null
    expiresAt?: string
    reason?: string
} | null> {
    const session = await getImpersonationSession()

    if (!session) {
        return null
    }

    return {
        isImpersonating: true,
        adminEmail: session.adminEmail,
        adminName: session.adminName,
        targetEmail: session.targetUserEmail,
        targetName: session.targetUserName,
        targetChurchName: session.targetChurchName,
        expiresAt: session.expiresAt.toISOString(),
        reason: session.reason,
    }
}
