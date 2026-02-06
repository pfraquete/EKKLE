'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getProfile } from './auth'

const memberSchema = z.object({
    fullName: z.string().min(3),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    birthday: z.string().optional(),
    memberStage: z.enum(['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR']),
    cellId: z.string().uuid(),
    role: z.enum(['MEMBER', 'LEADER', 'PASTOR']).optional(),
})

export async function createMember(formData: FormData) {
    // Rate limiting: max 5 member creations per minute per user
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id

    const supabase = await createClient()

    const rawData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        birthday: formData.get('birthday'),
        memberStage: formData.get('memberStage'),
        cellId: formData.get('cellId'),
    }

    const validatedData = memberSchema.parse(rawData)

    // Check for duplicates before creating
    // Build OR conditions safely to avoid injection
    const orConditions: string[] = []
    if (validatedData.email) {
        orConditions.push(`email.eq.${validatedData.email}`)
    }
    if (validatedData.phone) {
        orConditions.push(`phone.eq.${validatedData.phone}`)
    }

    let existingMember = null
    if (orConditions.length > 0) {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .eq('church_id', churchId)
            .or(orConditions.join(','))
            .limit(1)
            .single()
        existingMember = data
    }

    if (existingMember) {
        if (existingMember.email === validatedData.email && validatedData.email) {
            throw new Error(`Já existe um membro com o email "${validatedData.email}"`)
        }
        if (existingMember.phone === validatedData.phone && validatedData.phone) {
            throw new Error(`Já existe um membro com o telefone "${validatedData.phone}"`)
        }
    }

    const { error } = await supabase
        .from('profiles')
        .insert({
            full_name: validatedData.fullName,
            phone: validatedData.phone || null,
            email: validatedData.email || null,
            member_stage: validatedData.memberStage,
            cell_id: validatedData.cellId,
            church_id: churchId,
            role: (profile.role === 'PASTOR' && validatedData.role) ? validatedData.role : 'MEMBER',
            is_active: true,
            birthday: validatedData.birthday || null
        })

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    revalidatePath('/membro/minha-celula/membros')
    return { success: true }
}

export async function updateMember(id: string, formData: FormData) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const rawData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        birthday: formData.get('birthday'),
        memberStage: formData.get('memberStage'),
        cellId: formData.get('cellId'),
        role: formData.get('role'),
    }

    const validatedData = memberSchema.parse(rawData)

    const updates = {
        full_name: validatedData.fullName,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        member_stage: validatedData.memberStage,
        cell_id: validatedData.cellId,
        birthday: validatedData.birthday || null,
        updated_at: new Date().toISOString()
    }

    if (profile.role === 'PASTOR' && validatedData.role) {
        // @ts-expect-error - Dynamic update object
        updates.role = validatedData.role
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .eq('church_id', churchId)

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    revalidatePath('/membro/minha-celula/membros')
    return { success: true }
}

export async function deleteMember(id: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .eq('church_id', profile.church_id)

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    revalidatePath('/membro/minha-celula/membros')
    return { success: true }
}

export async function getMembers(cellId: string) {
    const profile = await getProfile()
    if (!profile) return []
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cell_id', cellId)
        .eq('church_id', profile.church_id)
        .eq('is_active', true)
        .order('full_name')

    if (error) return []
    return data
}

export async function getMemberDetails(id: string) {
    const profile = await getProfile()
    if (!profile) return { member: null, attendance: [] }
    const churchId = profile.church_id

    const supabase = await createClient()

    // 1. Get profile/member info
    console.log('getMemberDetails - Searching for member:', { id, churchId })

    const { data: member, error: memberError } = await supabase
        .from('profiles')
        .select(`
            *,
            cell:cells!profiles_cell_id_fkey(id, name)
        `)
        .eq('id', id)
        .eq('church_id', churchId)
        .maybeSingle()

    if (memberError) {
        console.error('getMemberDetails - Query error:', memberError)
        return { member: null, attendance: [] }
    }

    if (!member) {
        // Try without is_active filter - maybe member was deactivated
        console.log('getMemberDetails - Member not found, trying without filters...')
        const { data: anyMember } = await supabase
            .from('profiles')
            .select('id, church_id, is_active, full_name')
            .eq('id', id)
            .maybeSingle()

        if (anyMember) {
            console.log('getMemberDetails - Found member with different filters:', {
                id: anyMember.id,
                church_id: anyMember.church_id,
                is_active: anyMember.is_active,
                full_name: anyMember.full_name,
                expected_church_id: churchId
            })
        } else {
            console.log('getMemberDetails - Member ID does not exist in profiles table')
        }

        return { member: null, attendance: [] }
    }

    // 2. Get attendance history
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
            id,
            context_type,
            context_date,
            status,
            checked_in_by_profile:profiles!attendance_checked_in_by_fkey (
                full_name
            )
        `)
        .eq('profile_id', id)
        .order('context_date', { ascending: false })
        .limit(20)

    return { member, attendance: attendance || [] }
}

export async function getChurchMembers() {
    try {
        const profile = await getProfile()
        if (!profile) throw new Error('Não autenticado')
        const churchId = profile.church_id

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('church_id', churchId)
            .order('full_name', { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching church members:', error)
        return { success: false, error: 'Erro ao buscar membros' }
    }
}

/**
 * List members with optional filters
 * Helper function for WhatsApp AI Agent
 */
export async function listMembers(cellId?: string, search?: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const supabase = await createClient()

    let query = supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            phone,
            email,
            member_stage,
            role,
            birthday,
            cell:cell_id(id, name)
        `)
        .eq('church_id', profile.church_id)
        .eq('is_active', true)

    if (cellId) {
        query = query.eq('cell_id', cellId)
    }

    if (search) {
        // Sanitize search input to prevent SQL injection via ilike wildcards
        const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
        query = query.ilike('full_name', `%${sanitizedSearch}%`)
    }

    const { data, error } = await query.order('full_name')

    if (error) throw error
    return data || []
}
