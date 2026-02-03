'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export interface ChurchWithDetails {
    id: string
    name: string
    slug: string
    logo_url: string | null
    description: string | null
    address: string | null
    status: 'active' | 'suspended' | 'deleted' | null
    suspended_at: string | null
    suspended_by: string | null
    suspension_reason: string | null
    admin_notes: string | null
    created_at: string
    updated_at: string
    subscription?: {
        id: string
        status: string
        plan: {
            name: string
            price_monthly: number
        }
    }
    members_count?: number
    cells_count?: number
    pastor?: {
        id: string
        full_name: string
        email: string
    }
}

export interface ChurchFilters {
    search?: string
    status?: 'active' | 'suspended' | 'all'
    hasSubscription?: boolean
    page?: number
    limit?: number
}

/**
 * Get all churches with filters and pagination
 */
export async function getAllChurches(filters: ChurchFilters = {}) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { search, status = 'all', page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    let query = supabase
        .from('churches')
        .select(`
            *,
            subscriptions(id, status, plans(name, price_monthly))
        `, { count: 'exact' })

    // Apply filters
    if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    if (status !== 'all') {
        if (status === 'active') {
            query = query.or('status.eq.active,status.is.null')
        } else {
            query = query.eq('status', status)
        }
    }

    // Apply pagination
    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    const { data: churches, count, error } = await query

    if (error) {
        console.error('[Super Admin] Failed to fetch churches:', error)
        throw new Error('Falha ao buscar igrejas')
    }

    // Get member counts for each church
    const churchIds = churches?.map(c => c.id) || []
    const { data: memberCounts } = await supabase
        .from('profiles')
        .select('church_id')
        .in('church_id', churchIds)

    const memberCountMap = new Map<string, number>()
    memberCounts?.forEach(m => {
        const count = memberCountMap.get(m.church_id) || 0
        memberCountMap.set(m.church_id, count + 1)
    })

    const churchesWithCounts = churches?.map(church => ({
        ...church,
        members_count: memberCountMap.get(church.id) || 0,
        subscription: church.subscriptions?.[0] || null
    }))

    return {
        churches: churchesWithCounts || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

/**
 * Get detailed information about a specific church
 */
export async function getChurchDetails(churchId: string): Promise<ChurchWithDetails | null> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: church, error } = await supabase
        .from('churches')
        .select(`
            *,
            subscriptions(id, status, plans(name, price_monthly, price_yearly))
        `)
        .eq('id', churchId)
        .single()

    if (error || !church) {
        return null
    }

    // Get pastor
    const { data: pastor } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('church_id', churchId)
        .eq('role', 'PASTOR')
        .single()

    // Get counts
    const [membersResult, cellsResult] = await Promise.all([
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId),
        supabase
            .from('cells')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId)
    ])

    // Log the view action
    await logAdminAction('church.view', 'church', {
        targetId: churchId
    })

    return {
        ...church,
        subscription: church.subscriptions?.[0] || null,
        members_count: membersResult.count || 0,
        cells_count: cellsResult.count || 0,
        pastor: pastor || undefined
    }
}

/**
 * Suspend a church
 */
export async function suspendChurch(churchId: string, reason: string) {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    // Get current church data for audit
    const { data: oldChurch } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single()

    if (!oldChurch) {
        throw new Error('Igreja nao encontrada')
    }

    if (oldChurch.status === 'suspended') {
        throw new Error('Igreja ja esta suspensa')
    }

    const { error } = await supabase
        .from('churches')
        .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_by: admin.id,
            suspension_reason: reason
        })
        .eq('id', churchId)

    if (error) {
        console.error('[Super Admin] Failed to suspend church:', error)
        throw new Error('Falha ao suspender igreja')
    }

    // Log the action
    await logAdminAction('church.suspend', 'church', {
        targetId: churchId,
        churchId,
        oldValue: { status: oldChurch.status },
        newValue: { status: 'suspended', suspension_reason: reason },
        reason
    })

    revalidatePath('/admin/churches')
    revalidatePath(`/admin/churches/${churchId}`)

    return { success: true }
}

/**
 * Reactivate a suspended church
 */
export async function reactivateChurch(churchId: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get current church data
    const { data: oldChurch } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single()

    if (!oldChurch) {
        throw new Error('Igreja nao encontrada')
    }

    if (oldChurch.status !== 'suspended') {
        throw new Error('Igreja nao esta suspensa')
    }

    const { error } = await supabase
        .from('churches')
        .update({
            status: 'active',
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null
        })
        .eq('id', churchId)

    if (error) {
        console.error('[Super Admin] Failed to reactivate church:', error)
        throw new Error('Falha ao reativar igreja')
    }

    // Log the action
    await logAdminAction('church.reactivate', 'church', {
        targetId: churchId,
        churchId,
        oldValue: { status: 'suspended' },
        newValue: { status: 'active' }
    })

    revalidatePath('/admin/churches')
    revalidatePath(`/admin/churches/${churchId}`)

    return { success: true }
}

/**
 * Update admin notes for a church
 */
export async function updateChurchAdminNotes(churchId: string, notes: string) {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: oldChurch } = await supabase
        .from('churches')
        .select('admin_notes')
        .eq('id', churchId)
        .single()

    const { error } = await supabase
        .from('churches')
        .update({ admin_notes: notes })
        .eq('id', churchId)

    if (error) {
        throw new Error('Falha ao atualizar notas')
    }

    await logAdminAction('church.update', 'church', {
        targetId: churchId,
        churchId,
        oldValue: { admin_notes: oldChurch?.admin_notes },
        newValue: { admin_notes: notes }
    })

    revalidatePath(`/admin/churches/${churchId}`)

    return { success: true }
}

/**
 * Soft delete a church
 */
export async function deleteChurch(churchId: string, reason: string) {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    const { data: oldChurch } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single()

    if (!oldChurch) {
        throw new Error('Igreja nao encontrada')
    }

    const { error } = await supabase
        .from('churches')
        .update({
            status: 'deleted',
            suspended_at: new Date().toISOString(),
            suspended_by: admin.id,
            suspension_reason: reason
        })
        .eq('id', churchId)

    if (error) {
        throw new Error('Falha ao deletar igreja')
    }

    await logAdminAction('church.delete', 'church', {
        targetId: churchId,
        churchId,
        oldValue: { status: oldChurch.status },
        newValue: { status: 'deleted' },
        reason
    })

    revalidatePath('/admin/churches')

    return { success: true }
}
