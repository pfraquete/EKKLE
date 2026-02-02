'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface KidsChild {
    id: string
    church_id: string
    kids_cell_id: string | null
    full_name: string
    birth_date: string | null
    gender: 'M' | 'F' | null
    parent_name: string | null
    parent_phone: string | null
    parent_email: string | null
    parent_profile_id: string | null
    allergies: string | null
    medical_notes: string | null
    photo_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    // Relations
    kids_cell?: {
        id: string
        name: string
    } | null
    parent_profile?: {
        id: string
        full_name: string
        phone: string | null
    } | null
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createChildSchema = z.object({
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    birth_date: z.string().optional().nullable(),
    gender: z.enum(['M', 'F']).optional().nullable(),
    parent_name: z.string().optional().nullable(),
    parent_phone: z.string().optional().nullable(),
    parent_email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
    parent_profile_id: z.string().uuid().optional().nullable(),
    kids_cell_id: z.string().uuid().optional().nullable(),
    allergies: z.string().optional().nullable(),
    medical_notes: z.string().optional().nullable(),
})

const updateChildSchema = createChildSchema.partial()

// =====================================================
// HELPER: Check Kids Network Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTORA_KIDS', 'PASTOR']) {
    const profile = await getProfile()
    if (!profile) {
        return { error: 'Não autenticado', profile: null }
    }

    // Pastor sempre tem acesso
    if (profile.role === 'PASTOR') {
        return { error: null, profile }
    }

    // Verificar se tem papel na rede kids
    const supabase = await createClient()
    const { data: membership } = await supabase
        .from('kids_network_membership')
        .select('kids_role')
        .eq('profile_id', profile.id)
        .eq('church_id', profile.church_id)
        .single()

    if (!membership || !requiredRoles.includes(membership.kids_role)) {
        return { error: 'Sem permissão para esta ação', profile: null }
    }

    return { error: null, profile, kidsRole: membership.kids_role }
}

// =====================================================
// CREATE CHILD
// =====================================================

export async function createKidsChild(data: z.infer<typeof createChildSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissão' }
        }

        const validated = createChildSchema.parse(data)
        const supabase = await createClient()

        const { data: child, error } = await supabase
            .from('kids_children')
            .insert({
                church_id: profile.church_id,
                full_name: validated.full_name,
                birth_date: validated.birth_date || null,
                gender: validated.gender || null,
                parent_name: validated.parent_name || null,
                parent_phone: validated.parent_phone || null,
                parent_email: validated.parent_email || null,
                parent_profile_id: validated.parent_profile_id || null,
                kids_cell_id: validated.kids_cell_id || null,
                allergies: validated.allergies || null,
                medical_notes: validated.medical_notes || null,
                is_active: true,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating kids child:', error)
            return { success: false, error: 'Erro ao cadastrar criança' }
        }

        revalidatePath('/rede-kids')
        revalidatePath('/rede-kids/criancas')

        return { success: true, data: child }
    } catch (error) {
        console.error('Error in createKidsChild:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
        }
        return { success: false, error: 'Erro ao cadastrar criança' }
    }
}

// =====================================================
// UPDATE CHILD
// =====================================================

export async function updateKidsChild(id: string, data: z.infer<typeof updateChildSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissão' }
        }

        const validated = updateChildSchema.parse(data)
        const supabase = await createClient()

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (validated.full_name !== undefined) updateData.full_name = validated.full_name
        if (validated.birth_date !== undefined) updateData.birth_date = validated.birth_date
        if (validated.gender !== undefined) updateData.gender = validated.gender
        if (validated.parent_name !== undefined) updateData.parent_name = validated.parent_name
        if (validated.parent_phone !== undefined) updateData.parent_phone = validated.parent_phone
        if (validated.parent_email !== undefined) updateData.parent_email = validated.parent_email || null
        if (validated.parent_profile_id !== undefined) updateData.parent_profile_id = validated.parent_profile_id
        if (validated.kids_cell_id !== undefined) updateData.kids_cell_id = validated.kids_cell_id
        if (validated.allergies !== undefined) updateData.allergies = validated.allergies
        if (validated.medical_notes !== undefined) updateData.medical_notes = validated.medical_notes

        const { data: child, error } = await supabase
            .from('kids_children')
            .update(updateData)
            .eq('id', id)
            .eq('church_id', profile.church_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating kids child:', error)
            return { success: false, error: 'Erro ao atualizar criança' }
        }

        revalidatePath('/rede-kids')
        revalidatePath('/rede-kids/criancas')
        revalidatePath(`/rede-kids/criancas/${id}`)

        return { success: true, data: child }
    } catch (error) {
        console.error('Error in updateKidsChild:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
        }
        return { success: false, error: 'Erro ao atualizar criança' }
    }
}

// =====================================================
// DELETE CHILD (soft delete)
// =====================================================

export async function deleteKidsChild(id: string) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissão' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('kids_children')
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('church_id', profile.church_id)

        if (error) {
            console.error('Error deleting kids child:', error)
            return { success: false, error: 'Erro ao remover criança' }
        }

        revalidatePath('/rede-kids')
        revalidatePath('/rede-kids/criancas')

        return { success: true }
    } catch (error) {
        console.error('Error in deleteKidsChild:', error)
        return { success: false, error: 'Erro ao remover criança' }
    }
}

// =====================================================
// GET CHILDREN
// =====================================================

export async function getKidsChildren(filters?: {
    cellId?: string
    search?: string
    includeInactive?: boolean
}): Promise<KidsChild[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        let query = supabase
            .from('kids_children')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                parent_profile:profiles!kids_children_parent_profile_id_fkey(id, full_name, phone)
            `)
            .eq('church_id', profile.church_id)
            .order('full_name')

        if (!filters?.includeInactive) {
            query = query.eq('is_active', true)
        }

        if (filters?.cellId) {
            query = query.eq('kids_cell_id', filters.cellId)
        }

        if (filters?.search) {
            const sanitizedSearch = filters.search.replace(/[%_\\]/g, '\\$&')
            query = query.ilike('full_name', `%${sanitizedSearch}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching kids children:', error)
            return []
        }

        return data as KidsChild[]
    } catch (error) {
        console.error('Error in getKidsChildren:', error)
        return []
    }
}

// =====================================================
// GET CHILD BY ID
// =====================================================

export async function getKidsChildById(id: string): Promise<KidsChild | null> {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_children')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                parent_profile:profiles!kids_children_parent_profile_id_fkey(id, full_name, phone)
            `)
            .eq('id', id)
            .eq('church_id', profile.church_id)
            .single()

        if (error) {
            console.error('Error fetching kids child:', error)
            return null
        }

        return data as KidsChild
    } catch (error) {
        console.error('Error in getKidsChildById:', error)
        return null
    }
}

// =====================================================
// GET CHILDREN BY PARENT
// =====================================================

export async function getKidsChildrenByParent(parentProfileId: string): Promise<KidsChild[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_children')
            .select(`
                *,
                kids_cell:kids_cells(id, name)
            `)
            .eq('parent_profile_id', parentProfileId)
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .order('full_name')

        if (error) {
            console.error('Error fetching children by parent:', error)
            return []
        }

        return data as KidsChild[]
    } catch (error) {
        console.error('Error in getKidsChildrenByParent:', error)
        return []
    }
}

// =====================================================
// GET CHILDREN STATS
// =====================================================

export async function getKidsChildrenStats() {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        // Total de crianças ativas
        const { count: total } = await supabase
            .from('kids_children')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('is_active', true)

        // Crianças por gênero
        const { data: byGender } = await supabase
            .from('kids_children')
            .select('gender')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)

        const genderStats = {
            M: byGender?.filter(c => c.gender === 'M').length || 0,
            F: byGender?.filter(c => c.gender === 'F').length || 0,
            undefined: byGender?.filter(c => !c.gender).length || 0,
        }

        // Crianças sem célula
        const { count: withoutCell } = await supabase
            .from('kids_children')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .is('kids_cell_id', null)

        // Aniversariantes do mês
        const currentMonth = new Date().getMonth() + 1
        const { data: birthdays } = await supabase
            .from('kids_children')
            .select('id, full_name, birth_date')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .not('birth_date', 'is', null)

        const birthdaysThisMonth = birthdays?.filter(c => {
            if (!c.birth_date) return false
            const month = new Date(c.birth_date).getMonth() + 1
            return month === currentMonth
        }) || []

        return {
            total: total || 0,
            genderStats,
            maleCount: genderStats.M,
            femaleCount: genderStats.F,
            withoutCell: withoutCell || 0,
            birthdaysThisMonth,
        }
    } catch (error) {
        console.error('Error in getKidsChildrenStats:', error)
        return null
    }
}

// =====================================================
// GET BIRTHDAYS THIS MONTH
// =====================================================

export async function getKidsBirthdaysThisMonth(): Promise<{ id: string; full_name: string; birth_date: string }[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()
        const currentMonth = new Date().getMonth() + 1

        const { data: birthdays } = await supabase
            .from('kids_children')
            .select('id, full_name, birth_date')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .not('birth_date', 'is', null)

        return birthdays?.filter(c => {
            if (!c.birth_date) return false
            const month = new Date(c.birth_date).getMonth() + 1
            return month === currentMonth
        }) || []
    } catch (error) {
        console.error('Error in getKidsBirthdaysThisMonth:', error)
        return []
    }
}

// =====================================================
// ASSIGN CHILD TO CELL
// =====================================================

export async function assignChildToCell(childId: string, cellId: string | null) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissão' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('kids_children')
            .update({
                kids_cell_id: cellId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', childId)
            .eq('church_id', profile.church_id)

        if (error) {
            console.error('Error assigning child to cell:', error)
            return { success: false, error: 'Erro ao atribuir criança à célula' }
        }

        revalidatePath('/rede-kids')
        revalidatePath('/rede-kids/criancas')

        return { success: true }
    } catch (error) {
        console.error('Error in assignChildToCell:', error)
        return { success: false, error: 'Erro ao atribuir criança à célula' }
    }
}
