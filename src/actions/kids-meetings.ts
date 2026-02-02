'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface KidsMeeting {
    id: string
    church_id: string
    kids_cell_id: string
    meeting_date: string
    meeting_time: string | null
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
    theme: string | null
    bible_verse: string | null
    notes: string | null
    kids_present: number
    volunteers_present: number
    created_by: string | null
    completed_by: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
    // Relations
    kids_cell?: {
        id: string
        name: string
    } | null
    creator?: {
        id: string
        full_name: string
    } | null
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createMeetingSchema = z.object({
    kids_cell_id: z.string().uuid('Celula invalida'),
    meeting_date: z.string().min(1, 'Data e obrigatoria'),
    meeting_time: z.string().optional().nullable(),
    theme: z.string().optional().nullable(),
    bible_verse: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})

const updateMeetingSchema = createMeetingSchema.partial().extend({
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
})

// =====================================================
// HELPER: Check Kids Network Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTORA_KIDS', 'PASTOR']) {
    const profile = await getProfile()
    if (!profile) {
        return { error: 'Nao autenticado', profile: null }
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
        return { error: 'Sem permissao para esta acao', profile: null }
    }

    return { error: null, profile, kidsRole: membership.kids_role }
}

// =====================================================
// CREATE MEETING
// =====================================================

export async function createKidsMeeting(data: z.infer<typeof createMeetingSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const validated = createMeetingSchema.parse(data)
        const supabase = await createClient()

        const { data: meeting, error } = await supabase
            .from('kids_cell_meetings')
            .insert({
                church_id: profile.church_id,
                kids_cell_id: validated.kids_cell_id,
                meeting_date: validated.meeting_date,
                meeting_time: validated.meeting_time || null,
                theme: validated.theme || null,
                bible_verse: validated.bible_verse || null,
                notes: validated.notes || null,
                status: 'SCHEDULED',
                created_by: profile.id,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating kids meeting:', error)
            return { success: false, error: 'Erro ao agendar reuniao' }
        }

        revalidatePath('/rede-kids')
        revalidatePath(`/rede-kids/celulas/${validated.kids_cell_id}`)
        revalidatePath(`/rede-kids/celulas/${validated.kids_cell_id}/reunioes`)

        return { success: true, data: meeting }
    } catch (error) {
        console.error('Error in createKidsMeeting:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados invalidos' }
        }
        return { success: false, error: 'Erro ao agendar reuniao' }
    }
}

// =====================================================
// UPDATE MEETING
// =====================================================

export async function updateKidsMeeting(id: string, data: z.infer<typeof updateMeetingSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const validated = updateMeetingSchema.parse(data)
        const supabase = await createClient()

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (validated.kids_cell_id !== undefined) updateData.kids_cell_id = validated.kids_cell_id
        if (validated.meeting_date !== undefined) updateData.meeting_date = validated.meeting_date
        if (validated.meeting_time !== undefined) updateData.meeting_time = validated.meeting_time
        if (validated.theme !== undefined) updateData.theme = validated.theme
        if (validated.bible_verse !== undefined) updateData.bible_verse = validated.bible_verse
        if (validated.notes !== undefined) updateData.notes = validated.notes
        if (validated.status !== undefined) {
            updateData.status = validated.status
            if (validated.status === 'COMPLETED') {
                updateData.completed_by = profile.id
                updateData.completed_at = new Date().toISOString()
            }
        }

        const { data: meeting, error } = await supabase
            .from('kids_cell_meetings')
            .update(updateData)
            .eq('id', id)
            .eq('church_id', profile.church_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating kids meeting:', error)
            return { success: false, error: 'Erro ao atualizar reuniao' }
        }

        revalidatePath('/rede-kids')
        revalidatePath(`/rede-kids/celulas/${meeting.kids_cell_id}`)
        revalidatePath(`/rede-kids/celulas/${meeting.kids_cell_id}/reunioes`)
        revalidatePath(`/rede-kids/celulas/${meeting.kids_cell_id}/reunioes/${id}`)

        return { success: true, data: meeting }
    } catch (error) {
        console.error('Error in updateKidsMeeting:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados invalidos' }
        }
        return { success: false, error: 'Erro ao atualizar reuniao' }
    }
}

// =====================================================
// CANCEL MEETING
// =====================================================

export async function cancelKidsMeeting(id: string) {
    return updateKidsMeeting(id, { status: 'CANCELED' })
}

// =====================================================
// COMPLETE MEETING
// =====================================================

export async function completeKidsMeeting(id: string, notes?: string) {
    return updateKidsMeeting(id, { status: 'COMPLETED', notes })
}

// =====================================================
// START MEETING
// =====================================================

export async function startKidsMeeting(id: string) {
    return updateKidsMeeting(id, { status: 'IN_PROGRESS' })
}

// =====================================================
// DELETE MEETING
// =====================================================

export async function deleteKidsMeeting(id: string) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const supabase = await createClient()

        // Primeiro buscar a reuniao para saber a celula
        const { data: meeting } = await supabase
            .from('kids_cell_meetings')
            .select('kids_cell_id')
            .eq('id', id)
            .eq('church_id', profile.church_id)
            .single()

        const { error } = await supabase
            .from('kids_cell_meetings')
            .delete()
            .eq('id', id)
            .eq('church_id', profile.church_id)

        if (error) {
            console.error('Error deleting kids meeting:', error)
            return { success: false, error: 'Erro ao remover reuniao' }
        }

        revalidatePath('/rede-kids')
        if (meeting) {
            revalidatePath(`/rede-kids/celulas/${meeting.kids_cell_id}`)
            revalidatePath(`/rede-kids/celulas/${meeting.kids_cell_id}/reunioes`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error in deleteKidsMeeting:', error)
        return { success: false, error: 'Erro ao remover reuniao' }
    }
}

// =====================================================
// GET MEETINGS BY CELL
// =====================================================

export async function getKidsMeetingsByCell(cellId: string, filters?: {
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
}): Promise<KidsMeeting[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        let query = supabase
            .from('kids_cell_meetings')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                creator:profiles!kids_cell_meetings_created_by_fkey(id, full_name)
            `)
            .eq('church_id', profile.church_id)
            .eq('kids_cell_id', cellId)
            .order('meeting_date', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.startDate) {
            query = query.gte('meeting_date', filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte('meeting_date', filters.endDate)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching kids meetings:', error)
            return []
        }

        return data as KidsMeeting[]
    } catch (error) {
        console.error('Error in getKidsMeetingsByCell:', error)
        return []
    }
}

// =====================================================
// GET ALL MEETINGS
// =====================================================

export async function getKidsMeetings(filters?: {
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
}): Promise<KidsMeeting[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        let query = supabase
            .from('kids_cell_meetings')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                creator:profiles!kids_cell_meetings_created_by_fkey(id, full_name)
            `)
            .eq('church_id', profile.church_id)
            .order('meeting_date', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.startDate) {
            query = query.gte('meeting_date', filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte('meeting_date', filters.endDate)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching kids meetings:', error)
            return []
        }

        return data as KidsMeeting[]
    } catch (error) {
        console.error('Error in getKidsMeetings:', error)
        return []
    }
}

// =====================================================
// GET MEETING BY ID
// =====================================================

export async function getKidsMeetingById(id: string): Promise<KidsMeeting | null> {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_cell_meetings')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                creator:profiles!kids_cell_meetings_created_by_fkey(id, full_name)
            `)
            .eq('id', id)
            .eq('church_id', profile.church_id)
            .single()

        if (error) {
            console.error('Error fetching kids meeting:', error)
            return null
        }

        return data as KidsMeeting
    } catch (error) {
        console.error('Error in getKidsMeetingById:', error)
        return null
    }
}

// =====================================================
// GET UPCOMING MEETINGS
// =====================================================

export async function getUpcomingKidsMeetings(cellId?: string, limit: number = 5): Promise<KidsMeeting[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]

        let query = supabase
            .from('kids_cell_meetings')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                creator:profiles!kids_cell_meetings_created_by_fkey(id, full_name)
            `)
            .eq('church_id', profile.church_id)
            .gte('meeting_date', today)
            .in('status', ['SCHEDULED', 'IN_PROGRESS'])
            .order('meeting_date', { ascending: true })
            .limit(limit)

        if (cellId) {
            query = query.eq('kids_cell_id', cellId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching upcoming meetings:', error)
            return []
        }

        return data as KidsMeeting[]
    } catch (error) {
        console.error('Error in getUpcomingKidsMeetings:', error)
        return []
    }
}

// =====================================================
// GET MEETINGS STATS
// =====================================================

export async function getKidsMeetingsStats(cellId?: string) {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()
        const today = new Date()
        const thisMonth = today.toISOString().slice(0, 7) // YYYY-MM

        // Total de reunioes
        let totalQuery = supabase
            .from('kids_cell_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)

        if (cellId) {
            totalQuery = totalQuery.eq('kids_cell_id', cellId)
        }

        const { count: total } = await totalQuery

        // Reunioes este mes
        let thisMonthQuery = supabase
            .from('kids_cell_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .gte('meeting_date', `${thisMonth}-01`)
            .lte('meeting_date', `${thisMonth}-31`)

        if (cellId) {
            thisMonthQuery = thisMonthQuery.eq('kids_cell_id', cellId)
        }

        const { count: thisMonthCount } = await thisMonthQuery

        // Reunioes completadas este mes
        let completedQuery = supabase
            .from('kids_cell_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('status', 'COMPLETED')
            .gte('meeting_date', `${thisMonth}-01`)
            .lte('meeting_date', `${thisMonth}-31`)

        if (cellId) {
            completedQuery = completedQuery.eq('kids_cell_id', cellId)
        }

        const { count: completed } = await completedQuery

        // Proximas reunioes agendadas
        let upcomingQuery = supabase
            .from('kids_cell_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('status', 'SCHEDULED')
            .gte('meeting_date', today.toISOString().split('T')[0])

        if (cellId) {
            upcomingQuery = upcomingQuery.eq('kids_cell_id', cellId)
        }

        const { count: upcoming } = await upcomingQuery

        // Media de criancas presentes
        let avgQuery = supabase
            .from('kids_cell_meetings')
            .select('kids_present')
            .eq('church_id', profile.church_id)
            .eq('status', 'COMPLETED')

        if (cellId) {
            avgQuery = avgQuery.eq('kids_cell_id', cellId)
        }

        const { data: presenceData } = await avgQuery

        const avgKidsPresent = presenceData && presenceData.length > 0
            ? Math.round(presenceData.reduce((sum, m) => sum + (m.kids_present || 0), 0) / presenceData.length)
            : 0

        return {
            total: total || 0,
            thisMonth: thisMonthCount || 0,
            completed: completed || 0,
            upcoming: upcoming || 0,
            avgKidsPresent,
        }
    } catch (error) {
        console.error('Error in getKidsMeetingsStats:', error)
        return null
    }
}

// =====================================================
// GET RECENT COMPLETED MEETINGS
// =====================================================

export async function getRecentKidsMeetings(limit: number = 5): Promise<KidsMeeting[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_cell_meetings')
            .select(`
                *,
                kids_cell:kids_cells(id, name),
                creator:profiles!kids_cell_meetings_created_by_fkey(id, full_name)
            `)
            .eq('church_id', profile.church_id)
            .eq('status', 'COMPLETED')
            .order('completed_at', { ascending: false, nullsFirst: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching recent meetings:', error)
            return []
        }

        return data as KidsMeeting[]
    } catch (error) {
        console.error('Error in getRecentKidsMeetings:', error)
        return []
    }
}
