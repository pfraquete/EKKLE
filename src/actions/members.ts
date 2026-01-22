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
    const { data: existingMember } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('church_id', churchId)
        .or(`email.eq.${validatedData.email},phone.eq.${validatedData.phone}`)
        .limit(1)
        .single()

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
            role: 'MEMBER',
            is_active: true,
            birthday: validatedData.birthday || null
        })

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
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
    }

    const validatedData = memberSchema.parse(rawData)

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: validatedData.fullName,
            phone: validatedData.phone || null,
            email: validatedData.email || null,
            member_stage: validatedData.memberStage,
            cell_id: validatedData.cellId,
            birthday: validatedData.birthday || null
        })
        .eq('id', id)
        .eq('church_id', churchId)

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
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
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id

    const supabase = await createClient()

    // 1. Get profile/member info
    const { data: member, error: memberError } = await supabase
        .from('profiles')
        .select(`
            *,
            cell:cells (
                id,
                name
            )
        `)
        .eq('id', id)
        .eq('church_id', churchId)
        .single()

    if (memberError) {
        // Try 'members' table if not in 'profiles'
        const { data: m, error: mError } = await supabase
            .from('members')
            .select(`
                *,
                cell:cells (
                    id,
                    name
                )
            `)
            .eq('id', id)
            .eq('church_id', churchId)
            .single()

        if (mError) throw mError
        return { member: m, attendance: [] } // Members don't have attendance yet in the same way? Or they do?
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
