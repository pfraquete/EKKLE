'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const pixKeyTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'] as const

const updatePixSchema = z.object({
    pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
    pix_key_type: z.enum(pixKeyTypes),
})

type UpdatePixInput = z.infer<typeof updatePixSchema>

// =====================================================
// GET CHURCH PIX INFO
// =====================================================

export async function getChurchPix() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('churches')
        .select('pix_key, pix_key_type')
        .eq('id', profile.church_id)
        .single()

    if (error) {
        console.error('Error fetching church PIX:', error)
        return { success: false, error: 'Erro ao buscar informações PIX' }
    }

    return {
        success: true,
        data: {
            pix_key: data?.pix_key || null,
            pix_key_type: data?.pix_key_type || null,
        }
    }
}

// =====================================================
// UPDATE CHURCH PIX
// =====================================================

export async function updateChurchPix(input: UpdatePixInput) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    try {
        const validated = updatePixSchema.parse(input)

        const supabase = await createClient()

        const { error } = await supabase
            .from('churches')
            .update({
                pix_key: validated.pix_key,
                pix_key_type: validated.pix_key_type,
            })
            .eq('id', profile.church_id)

        if (error) {
            console.error('Error updating church PIX:', error)
            return { success: false, error: 'Erro ao atualizar PIX' }
        }

        revalidatePath('/configuracoes/pix')
        revalidatePath('/membro/dizimos')
        return { success: true }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: 'Erro ao atualizar PIX' }
    }
}

// =====================================================
// REMOVE CHURCH PIX
// =====================================================

export async function removeChurchPix() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('churches')
        .update({
            pix_key: null,
            pix_key_type: null,
        })
        .eq('id', profile.church_id)

    if (error) {
        console.error('Error removing church PIX:', error)
        return { success: false, error: 'Erro ao remover PIX' }
    }

    revalidatePath('/configuracoes/pix')
    revalidatePath('/membro/dizimos')
    return { success: true }
}
