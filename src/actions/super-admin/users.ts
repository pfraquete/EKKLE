'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export interface UserWithDetails {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    photo_url: string | null
    role: string
    member_stage: string | null
    is_active: boolean
    created_at: string
    church?: {
        id: string
        name: string
        slug: string
    } | null
}

export interface UserFilters {
    search?: string
    role?: string
    churchId?: string
    page?: number
    limit?: number
}

/**
 * Get all users with filters and pagination
 */
export async function getAllUsers(filters: UserFilters = {}) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { search, role, churchId, page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    let query = supabase
        .from('profiles')
        .select(`
            id,
            email,
            full_name,
            phone,
            photo_url,
            role,
            member_stage,
            is_active,
            created_at,
            church_id,
            church:churches(id, name, slug)
        `, { count: 'exact' })
        .neq('role', 'SUPER_ADMIN') // Don't show other super admins

    // Apply filters
    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (role && role !== 'all') {
        query = query.eq('role', role)
    }

    if (churchId) {
        query = query.eq('church_id', churchId)
    }

    // Apply pagination
    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data: users, count, error } = await query

    if (error) {
        console.error('[Super Admin] Failed to fetch users:', error)
        throw new Error('Falha ao buscar usuarios')
    }

    const usersWithChurch = users?.map(user => ({
        ...user,
        church: user.church || null
    })) || []

    return {
        users: usersWithChurch as UserWithDetails[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

/**
 * Get detailed information about a specific user
 */
export async function getUserDetails(userId: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: user, error } = await supabase
        .from('profiles')
        .select(`
            *,
            church:churches(id, name, slug, logo_url),
            cell:cells(id, name)
        `)
        .eq('id', userId)
        .single()

    if (error || !user) {
        console.error('[Super Admin] Failed to fetch user:', error)
        return null
    }

    // Don't allow viewing other super admins
    if (user.role === 'SUPER_ADMIN') {
        return null
    }

    // Log the view action
    await logAdminAction('user.view', 'profile', {
        targetId: userId,
        churchId: user.church_id
    })

    return user
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get current user data
    const { data: user } = await supabase
        .from('profiles')
        .select('role, church_id')
        .eq('id', userId)
        .single()

    if (!user) {
        throw new Error('Usuario nao encontrado')
    }

    // Prevent changing to/from SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' || newRole === 'SUPER_ADMIN') {
        throw new Error('Nao e possivel alterar para/de SUPER_ADMIN')
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        throw new Error('Falha ao atualizar role')
    }

    const action = newRole === 'PASTOR' || newRole === 'DISCIPULADOR' ? 'user.promote' : 'user.demote'

    await logAdminAction(action, 'profile', {
        targetId: userId,
        churchId: user.church_id,
        oldValue: { role: user.role },
        newValue: { role: newRole }
    })

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return { success: true }
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(userId: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get current status
    const { data: user } = await supabase
        .from('profiles')
        .select('is_active, role, church_id')
        .eq('id', userId)
        .single()

    if (!user) {
        throw new Error('Usuario nao encontrado')
    }

    if (user.role === 'SUPER_ADMIN') {
        throw new Error('Nao e possivel desativar super admin')
    }

    const newStatus = !user.is_active

    const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId)

    if (error) {
        throw new Error('Falha ao atualizar status')
    }

    await logAdminAction('user.update', 'profile', {
        targetId: userId,
        churchId: user.church_id,
        oldValue: { is_active: user.is_active },
        newValue: { is_active: newStatus }
    })

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return { success: true, is_active: newStatus }
}
