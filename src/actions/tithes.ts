'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createTitheSchema = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    amount_cents: z.number().int().min(0),
    receipt_url: z.string().url().optional().nullable(),
    payment_method: z.enum(['pix', 'cash', 'transfer', 'other']).optional(),
    notes: z.string().optional().nullable(),
})

const confirmTitheSchema = z.object({
    tithe_id: z.string().uuid(),
})

// =====================================================
// GET MEMBER TITHES (for current year)
// =====================================================

export async function getMemberTithes(year?: number) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()
    const currentYear = year || new Date().getFullYear()

    const { data, error } = await supabase
        .from('member_tithes')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('year', currentYear)
        .order('month', { ascending: true })

    if (error) {
        console.error('Error fetching tithes:', error)
        return { success: false, error: 'Erro ao buscar dízimos' }
    }

    // Create a map of month -> tithe for easy lookup
    const tithesByMonth: Record<number, typeof data[0]> = {}
    data?.forEach(tithe => {
        tithesByMonth[tithe.month] = tithe
    })

    return { success: true, data: tithesByMonth }
}

// =====================================================
// CREATE/UPDATE TITHE RECORD
// =====================================================

export async function saveTithe(input: z.infer<typeof createTitheSchema>) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    try {
        const validated = createTitheSchema.parse(input)
        const supabase = await createClient()

        // Check if tithe already exists for this month
        const { data: existing } = await supabase
            .from('member_tithes')
            .select('id, status')
            .eq('profile_id', profile.id)
            .eq('year', validated.year)
            .eq('month', validated.month)
            .single()

        if (existing) {
            // Update existing (only if PENDING)
            if (existing.status === 'CONFIRMED') {
                return { success: false, error: 'Este dízimo já foi confirmado e não pode ser alterado' }
            }

            const { error } = await supabase
                .from('member_tithes')
                .update({
                    amount_cents: validated.amount_cents,
                    receipt_url: validated.receipt_url,
                    payment_method: validated.payment_method,
                    notes: validated.notes,
                })
                .eq('id', existing.id)

            if (error) throw error
        } else {
            // Create new
            const { error } = await supabase
                .from('member_tithes')
                .insert({
                    church_id: profile.church_id,
                    profile_id: profile.id,
                    year: validated.year,
                    month: validated.month,
                    amount_cents: validated.amount_cents,
                    receipt_url: validated.receipt_url,
                    payment_method: validated.payment_method,
                    notes: validated.notes,
                    status: 'PENDING',
                })

            if (error) throw error
        }

        revalidatePath('/membro/dizimos')
        return { success: true }
    } catch (error) {
        console.error('Error saving tithe:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: 'Erro ao salvar dízimo' }
    }
}

// =====================================================
// UPLOAD RECEIPT (update receipt_url)
// =====================================================

export async function uploadTitheReceipt(titheId: string, receiptUrl: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Verify ownership
    const { data: tithe } = await supabase
        .from('member_tithes')
        .select('id, profile_id, status')
        .eq('id', titheId)
        .single()

    if (!tithe) {
        return { success: false, error: 'Dízimo não encontrado' }
    }

    if (tithe.profile_id !== profile.id) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    if (tithe.status === 'CONFIRMED') {
        return { success: false, error: 'Este dízimo já foi confirmado' }
    }

    const { error } = await supabase
        .from('member_tithes')
        .update({ receipt_url: receiptUrl })
        .eq('id', titheId)

    if (error) {
        console.error('Error uploading receipt:', error)
        return { success: false, error: 'Erro ao enviar comprovante' }
    }

    revalidatePath('/membro/dizimos')
    return { success: true }
}

// =====================================================
// CONFIRM TITHE (Finance Team / Pastor only)
// =====================================================

export async function confirmTithe(titheId: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Check if user is pastor or finance team
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    // Get the tithe
    const { data: tithe } = await supabase
        .from('member_tithes')
        .select('id, church_id, status')
        .eq('id', titheId)
        .single()

    if (!tithe) {
        return { success: false, error: 'Dízimo não encontrado' }
    }

    if (tithe.church_id !== profile.church_id) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    if (tithe.status === 'CONFIRMED') {
        return { success: false, error: 'Este dízimo já foi confirmado' }
    }

    const { error } = await supabase
        .from('member_tithes')
        .update({
            status: 'CONFIRMED',
            confirmed_by: profile.id,
            confirmed_at: new Date().toISOString(),
        })
        .eq('id', titheId)

    if (error) {
        console.error('Error confirming tithe:', error)
        return { success: false, error: 'Erro ao confirmar dízimo' }
    }

    revalidatePath('/membro/dizimos')
    revalidatePath('/dashboard/financeiro/dizimos')
    revalidatePath('/membro/financeiro/dizimos')
    return { success: true }
}

// =====================================================
// GET ALL TITHES (Pastor/Finance Team)
// =====================================================

interface GetAllTithesParams {
    year?: number
    month?: number
    status?: 'PENDING' | 'CONFIRMED'
    limit?: number
}

export async function getAllTithes(params: GetAllTithesParams = {}) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Check if user is pastor or finance team
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()
    const currentYear = params.year || new Date().getFullYear()
    const currentMonth = params.month || new Date().getMonth() + 1

    let query = supabase
        .from('member_tithes')
        .select(`
            *,
            profile:profiles(id, full_name, photo_url, email)
        `)
        .eq('church_id', profile.church_id)
        .eq('year', currentYear)

    if (params.month) {
        query = query.eq('month', currentMonth)
    }

    if (params.status) {
        query = query.eq('status', params.status)
    }

    query = query.order('month', { ascending: true })

    if (params.limit) {
        query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching all tithes:', error)
        return { success: false, error: 'Erro ao buscar dízimos' }
    }

    return { success: true, data }
}

// =====================================================
// GET TITHE SUMMARY (Pastor/Finance Team)
// =====================================================

export async function getTitheSummary(year?: number, month?: number) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Check if user is pastor or finance team
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()
    const currentYear = year || new Date().getFullYear()

    let query = supabase
        .from('member_tithes')
        .select('amount_cents, status, month')
        .eq('church_id', profile.church_id)
        .eq('year', currentYear)

    if (month) {
        query = query.eq('month', month)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching tithe summary:', error)
        return { success: false, error: 'Erro ao buscar resumo' }
    }

    // Calculate totals
    const confirmed = data?.filter(t => t.status === 'CONFIRMED') || []
    const pending = data?.filter(t => t.status === 'PENDING') || []

    const totalConfirmed = confirmed.reduce((sum, t) => sum + t.amount_cents, 0)
    const totalPending = pending.reduce((sum, t) => sum + t.amount_cents, 0)

    return {
        success: true,
        data: {
            totalConfirmed,
            totalPending,
            countConfirmed: confirmed.length,
            countPending: pending.length,
        }
    }
}

// =====================================================
// GET CHURCH PIX INFO
// =====================================================

export async function getChurchPixInfo() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('churches')
        .select('pix_key, pix_key_type, name')
        .eq('id', profile.church_id)
        .single()

    if (error) {
        console.error('Error fetching church pix:', error)
        return { success: false, error: 'Erro ao buscar PIX' }
    }

    return {
        success: true,
        data: {
            pixKey: data?.pix_key,
            pixKeyType: data?.pix_key_type,
            churchName: data?.name,
        }
    }
}
