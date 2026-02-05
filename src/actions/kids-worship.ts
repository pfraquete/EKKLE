'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface KidsWorshipService {
  id: string
  church_id: string
  title: string
  service_date: string
  service_time: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
  theme: string | null
  bible_verse: string | null
  description: string | null
  kids_present: number
  volunteers_present: number
  visitors_count: number
  notes: string | null
  created_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Relations
  creator?: {
    id: string
    full_name: string
  } | null
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createServiceSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  service_date: z.string().min(1, 'Data é obrigatória'),
  service_time: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  bible_verse: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

const updateServiceSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').optional(),
  service_date: z.string().optional(),
  service_time: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
  theme: z.string().optional().nullable(),
  bible_verse: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  kids_present: z.number().optional(),
  volunteers_present: z.number().optional(),
  visitors_count: z.number().optional(),
})

// =====================================================
// HELPER: Check Kids Permission
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
// CREATE WORSHIP SERVICE
// =====================================================

export async function createKidsWorshipService(data: z.infer<typeof createServiceSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'PASTOR'
    ])

    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = createServiceSchema.parse(data)
    const supabase = await createClient()

    const { data: service, error } = await supabase
      .from('kids_worship_services')
      .insert({
        church_id: profile.church_id,
        title: validated.title,
        service_date: validated.service_date,
        service_time: validated.service_time || null,
        theme: validated.theme || null,
        bible_verse: validated.bible_verse || null,
        description: validated.description || null,
        status: 'SCHEDULED',
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating kids worship service:', error)
      return { success: false, error: 'Erro ao criar culto kids' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/cultos')

    return { success: true, data: service }
  } catch (error) {
    console.error('Error in createKidsWorshipService:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar culto kids' }
  }
}

// =====================================================
// UPDATE WORSHIP SERVICE
// =====================================================

export async function updateKidsWorshipService(id: string, data: z.infer<typeof updateServiceSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'PASTOR'
    ])

    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = updateServiceSchema.parse(data)
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.service_date !== undefined) updateData.service_date = validated.service_date
    if (validated.service_time !== undefined) updateData.service_time = validated.service_time
    if (validated.theme !== undefined) updateData.theme = validated.theme
    if (validated.bible_verse !== undefined) updateData.bible_verse = validated.bible_verse
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.kids_present !== undefined) updateData.kids_present = validated.kids_present
    if (validated.volunteers_present !== undefined) updateData.volunteers_present = validated.volunteers_present
    if (validated.visitors_count !== undefined) updateData.visitors_count = validated.visitors_count
    if (validated.status !== undefined) {
      updateData.status = validated.status
      if (validated.status === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString()
      }
    }

    const { data: service, error } = await supabase
      .from('kids_worship_services')
      .update(updateData)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating kids worship service:', error)
      return { success: false, error: 'Erro ao atualizar culto kids' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/cultos')
    revalidatePath(`/rede-kids/cultos/${id}`)

    return { success: true, data: service }
  } catch (error) {
    console.error('Error in updateKidsWorshipService:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar culto kids' }
  }
}

// =====================================================
// DELETE WORSHIP SERVICE
// =====================================================

export async function deleteKidsWorshipService(id: string) {
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
      .from('kids_worship_services')
      .delete()
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error deleting kids worship service:', error)
      return { success: false, error: 'Erro ao remover culto kids' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/cultos')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteKidsWorshipService:', error)
    return { success: false, error: 'Erro ao remover culto kids' }
  }
}

// =====================================================
// GET WORSHIP SERVICES
// =====================================================

export async function getKidsWorshipServices(filters?: {
  status?: string
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<KidsWorshipService[]> {
  try {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    let query = supabase
      .from('kids_worship_services')
      .select(`
        *,
        creator:profiles!kids_worship_services_created_by_fkey(id, full_name)
      `)
      .eq('church_id', profile.church_id)
      .order('service_date', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.startDate) {
      query = query.gte('service_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('service_date', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching kids worship services:', error)
      return []
    }

    return data as KidsWorshipService[]
  } catch (error) {
    console.error('Error in getKidsWorshipServices:', error)
    return []
  }
}

// =====================================================
// GET SINGLE WORSHIP SERVICE
// =====================================================

export async function getKidsWorshipService(id: string): Promise<KidsWorshipService | null> {
  try {
    const profile = await getProfile()
    if (!profile) return null

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kids_worship_services')
      .select(`
        *,
        creator:profiles!kids_worship_services_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single()

    if (error) {
      console.error('Error fetching kids worship service:', error)
      return null
    }

    return data as KidsWorshipService
  } catch (error) {
    console.error('Error in getKidsWorshipService:', error)
    return null
  }
}

// =====================================================
// GET UPCOMING WORSHIP SERVICES
// =====================================================

export async function getUpcomingKidsWorshipServices(limit: number = 5): Promise<KidsWorshipService[]> {
  try {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('kids_worship_services')
      .select(`
        *,
        creator:profiles!kids_worship_services_created_by_fkey(id, full_name)
      `)
      .eq('church_id', profile.church_id)
      .gte('service_date', today)
      .in('status', ['SCHEDULED', 'IN_PROGRESS'])
      .order('service_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming worship services:', error)
      return []
    }

    return data as KidsWorshipService[]
  } catch (error) {
    console.error('Error in getUpcomingKidsWorshipServices:', error)
    return []
  }
}

// =====================================================
// GET WORSHIP SERVICE STATS
// =====================================================

export async function getKidsWorshipStats() {
  try {
    const profile = await getProfile()
    if (!profile) return null

    const supabase = await createClient()
    const today = new Date()
    const thisMonth = today.toISOString().slice(0, 7) // YYYY-MM

    // Total de cultos
    const { count: total } = await supabase
      .from('kids_worship_services')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)

    // Cultos este mês
    const { count: thisMonthCount } = await supabase
      .from('kids_worship_services')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .gte('service_date', `${thisMonth}-01`)
      .lte('service_date', `${thisMonth}-31`)

    // Cultos completados este mês
    const { count: completed } = await supabase
      .from('kids_worship_services')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .eq('status', 'COMPLETED')
      .gte('service_date', `${thisMonth}-01`)
      .lte('service_date', `${thisMonth}-31`)

    // Próximos cultos agendados
    const { count: upcoming } = await supabase
      .from('kids_worship_services')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .eq('status', 'SCHEDULED')
      .gte('service_date', today.toISOString().split('T')[0])

    // Média de crianças presentes
    const { data: avgData } = await supabase
      .from('kids_worship_services')
      .select('kids_present')
      .eq('church_id', profile.church_id)
      .eq('status', 'COMPLETED')

    let avgKidsPresent = 0
    if (avgData && avgData.length > 0) {
      const totalKids = avgData.reduce((sum, s) => sum + (s.kids_present || 0), 0)
      avgKidsPresent = Math.round(totalKids / avgData.length)
    }

    return {
      total: total || 0,
      thisMonth: thisMonthCount || 0,
      completed: completed || 0,
      upcoming: upcoming || 0,
      avgKidsPresent,
    }
  } catch (error) {
    console.error('Error in getKidsWorshipStats:', error)
    return null
  }
}

// =====================================================
// START WORSHIP SERVICE
// =====================================================

export async function startKidsWorshipService(id: string) {
  return updateKidsWorshipService(id, { status: 'IN_PROGRESS' })
}

// =====================================================
// COMPLETE WORSHIP SERVICE
// =====================================================

export async function completeKidsWorshipService(id: string, data: {
  kids_present: number
  volunteers_present: number
  visitors_count?: number
  notes?: string
}) {
  return updateKidsWorshipService(id, {
    status: 'COMPLETED',
    kids_present: data.kids_present,
    volunteers_present: data.volunteers_present,
    visitors_count: data.visitors_count || 0,
    notes: data.notes,
  })
}

// =====================================================
// CANCEL WORSHIP SERVICE
// =====================================================

export async function cancelKidsWorshipService(id: string) {
  return updateKidsWorshipService(id, { status: 'CANCELED' })
}
