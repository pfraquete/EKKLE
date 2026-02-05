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
  description: string | null
  service_date: string
  service_time: string | null
  type: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO'
  location: string | null
  youtube_url: string | null
  is_published: boolean
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
  theme: string | null
  bible_verse: string | null
  // Theater
  has_theater: boolean
  theater_theme: string | null
  theater_description: string | null
  // Teams
  preacher_id: string | null
  preacher_name: string | null
  opening_id: string | null
  offerings_id: string | null
  praise_team: string | null
  media_team: string | null
  welcome_team: string | null
  cleaning_team: string | null
  cafeteria_team: string | null
  communion_team: string | null
  // Stats
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
  preacher?: {
    id: string
    full_name: string
  } | null
  opening?: {
    id: string
    full_name: string
  } | null
  offerings?: {
    id: string
    full_name: string
  } | null
  theater_cast?: TheaterCastMember[]
}

export interface TheaterCastMember {
  id: string
  service_id: string
  profile_id: string
  role_name: string | null
  notes: string | null
  profile?: {
    id: string
    full_name: string
    photo_url: string | null
  }
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createServiceSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().optional().nullable(),
  service_date: z.string().min(1, 'Data é obrigatória'),
  service_time: z.string().optional().nullable(),
  type: z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']).default('PRESENCIAL'),
  location: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  theme: z.string().optional().nullable(),
  bible_verse: z.string().optional().nullable(),
  // Theater
  has_theater: z.boolean().default(false),
  theater_theme: z.string().optional().nullable(),
  theater_description: z.string().optional().nullable(),
  theater_cast_ids: z.array(z.string().uuid()).optional(),
  // Teams
  preacher_id: z.string().uuid().optional().nullable(),
  preacher_name: z.string().optional().nullable(),
  opening_id: z.string().uuid().optional().nullable(),
  offerings_id: z.string().uuid().optional().nullable(),
  praise_team: z.string().optional().nullable(),
  media_team: z.string().optional().nullable(),
  welcome_team: z.string().optional().nullable(),
  cleaning_team: z.string().optional().nullable(),
  cafeteria_team: z.string().optional().nullable(),
  communion_team: z.string().optional().nullable(),
})

const updateServiceSchema = createServiceSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
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

    // Extract theater_cast_ids before inserting
    const theaterCastIds = validated.theater_cast_ids || []

    const { data: service, error } = await supabase
      .from('kids_worship_services')
      .insert({
        church_id: profile.church_id,
        title: validated.title,
        description: validated.description || null,
        service_date: validated.service_date,
        service_time: validated.service_time || null,
        type: validated.type,
        location: validated.location || null,
        youtube_url: validated.youtube_url || null,
        is_published: validated.is_published,
        theme: validated.theme || null,
        bible_verse: validated.bible_verse || null,
        has_theater: validated.has_theater,
        theater_theme: validated.theater_theme || null,
        theater_description: validated.theater_description || null,
        preacher_id: validated.preacher_id || null,
        preacher_name: validated.preacher_name || null,
        opening_id: validated.opening_id || null,
        offerings_id: validated.offerings_id || null,
        praise_team: validated.praise_team || null,
        media_team: validated.media_team || null,
        welcome_team: validated.welcome_team || null,
        cleaning_team: validated.cleaning_team || null,
        cafeteria_team: validated.cafeteria_team || null,
        communion_team: validated.communion_team || null,
        status: 'SCHEDULED',
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating kids worship service:', error)
      return { success: false, error: 'Erro ao criar culto kids' }
    }

    // Insert theater cast members if any
    if (theaterCastIds.length > 0 && service) {
      const castInserts = theaterCastIds.map(profileId => ({
        service_id: service.id,
        profile_id: profileId,
      }))

      const { error: castError } = await supabase
        .from('kids_worship_theater_cast')
        .insert(castInserts)

      if (castError) {
        console.error('Error adding theater cast:', castError)
        // Don't fail the whole operation, just log
      }
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

    // Extract theater_cast_ids before updating
    const theaterCastIds = validated.theater_cast_ids

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Map all fields
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.service_date !== undefined) updateData.service_date = validated.service_date
    if (validated.service_time !== undefined) updateData.service_time = validated.service_time
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.location !== undefined) updateData.location = validated.location
    if (validated.youtube_url !== undefined) updateData.youtube_url = validated.youtube_url
    if (validated.is_published !== undefined) updateData.is_published = validated.is_published
    if (validated.theme !== undefined) updateData.theme = validated.theme
    if (validated.bible_verse !== undefined) updateData.bible_verse = validated.bible_verse
    if (validated.has_theater !== undefined) updateData.has_theater = validated.has_theater
    if (validated.theater_theme !== undefined) updateData.theater_theme = validated.theater_theme
    if (validated.theater_description !== undefined) updateData.theater_description = validated.theater_description
    if (validated.preacher_id !== undefined) updateData.preacher_id = validated.preacher_id
    if (validated.preacher_name !== undefined) updateData.preacher_name = validated.preacher_name
    if (validated.opening_id !== undefined) updateData.opening_id = validated.opening_id
    if (validated.offerings_id !== undefined) updateData.offerings_id = validated.offerings_id
    if (validated.praise_team !== undefined) updateData.praise_team = validated.praise_team
    if (validated.media_team !== undefined) updateData.media_team = validated.media_team
    if (validated.welcome_team !== undefined) updateData.welcome_team = validated.welcome_team
    if (validated.cleaning_team !== undefined) updateData.cleaning_team = validated.cleaning_team
    if (validated.cafeteria_team !== undefined) updateData.cafeteria_team = validated.cafeteria_team
    if (validated.communion_team !== undefined) updateData.communion_team = validated.communion_team
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

    // Update theater cast if provided
    if (theaterCastIds !== undefined) {
      // Remove existing cast
      await supabase
        .from('kids_worship_theater_cast')
        .delete()
        .eq('service_id', id)

      // Insert new cast
      if (theaterCastIds.length > 0) {
        const castInserts = theaterCastIds.map(profileId => ({
          service_id: id,
          profile_id: profileId,
        }))

        await supabase
          .from('kids_worship_theater_cast')
          .insert(castInserts)
      }
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
        creator:profiles!kids_worship_services_created_by_fkey(id, full_name),
        preacher:profiles!kids_worship_services_preacher_id_fkey(id, full_name),
        opening:profiles!kids_worship_services_opening_id_fkey(id, full_name),
        offerings:profiles!kids_worship_services_offerings_id_fkey(id, full_name)
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
        creator:profiles!kids_worship_services_created_by_fkey(id, full_name),
        preacher:profiles!kids_worship_services_preacher_id_fkey(id, full_name),
        opening:profiles!kids_worship_services_opening_id_fkey(id, full_name),
        offerings:profiles!kids_worship_services_offerings_id_fkey(id, full_name)
      `)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single()

    if (error) {
      console.error('Error fetching kids worship service:', error)
      return null
    }

    // Get theater cast
    const { data: theaterCast } = await supabase
      .from('kids_worship_theater_cast')
      .select(`
        *,
        profile:profiles(id, full_name, photo_url)
      `)
      .eq('service_id', id)

    return {
      ...data,
      theater_cast: theaterCast || [],
    } as KidsWorshipService
  } catch (error) {
    console.error('Error in getKidsWorshipService:', error)
    return null
  }
}

// =====================================================
// GET THEATER CAST FOR SERVICE
// =====================================================

export async function getTheaterCast(serviceId: string): Promise<TheaterCastMember[]> {
  try {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kids_worship_theater_cast')
      .select(`
        *,
        profile:profiles(id, full_name, photo_url)
      `)
      .eq('service_id', serviceId)

    if (error) {
      console.error('Error fetching theater cast:', error)
      return []
    }

    return data as TheaterCastMember[]
  } catch (error) {
    console.error('Error in getTheaterCast:', error)
    return []
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
