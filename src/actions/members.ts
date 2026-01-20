'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const memberSchema = z.object({
    fullName: z.string().min(3),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    birthday: z.string().optional(),
    memberStage: z.enum(['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR']),
    cellId: z.string().uuid(),
    churchId: z.string().uuid()
})

export async function createMember(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        birthday: formData.get('birthday'),
        memberStage: formData.get('memberStage'),
        cellId: formData.get('cellId'),
        churchId: formData.get('churchId'),
    }

    const validatedData = memberSchema.parse(rawData)

    const { error } = await supabase
        .from('profiles')
        .insert({
            full_name: validatedData.fullName,
            phone: validatedData.phone || null,
            email: validatedData.email || null,
            member_stage: validatedData.memberStage,
            cell_id: validatedData.cellId,
            church_id: validatedData.churchId,
            role: 'MEMBER',
            is_active: true
        })

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    return { success: true }
}

export async function updateMember(id: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        birthday: formData.get('birthday'),
        memberStage: formData.get('memberStage'),
        cellId: formData.get('cellId'),
        churchId: formData.get('churchId'),
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
        })
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    return { success: true }
}

export async function deleteMember(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/minha-celula/membros')
    return { success: true }
}

export async function getMembers(cellId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cell_id', cellId)
        .eq('is_active', true)
        .order('full_name')

    if (error) return []
    return data
}
