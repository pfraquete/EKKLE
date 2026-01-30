'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EKKLE_HUB_ID, isEkkleHubUser } from '@/lib/ekkle-utils'

export interface PublicChurch {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  city: string | null
  state: string | null
  member_count: number
}

export interface SearchFilters {
  query?: string
  city?: string
  state?: string
}

/**
 * Get list of public churches for the directory
 */
export async function getPublicChurches(filters?: SearchFilters): Promise<{
  success: boolean
  churches?: PublicChurch[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Build query for public churches
    let query = supabase
      .from('churches')
      .select(`
        id,
        name,
        slug,
        logo_url,
        description,
        city,
        state
      `)
      .eq('is_public_listed', true)
      .neq('id', EKKLE_HUB_ID)
      .order('name')

    // Apply filters
    if (filters?.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    const { data: churches, error } = await query

    if (error) {
      console.error('Error fetching public churches:', error)
      return { success: false, error: 'Erro ao buscar igrejas' }
    }

    // Get member counts for each church
    const churchesWithCounts = await Promise.all(
      (churches || []).map(async (church) => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', church.id)
          .eq('is_active', true)

        return {
          ...church,
          member_count: count || 0,
        }
      })
    )

    return { success: true, churches: churchesWithCounts }
  } catch (error) {
    console.error('Error in getPublicChurches:', error)
    return { success: false, error: 'Erro ao buscar igrejas' }
  }
}

/**
 * Get a single church by ID for display
 */
export async function getChurchById(churchId: string): Promise<{
  success: boolean
  church?: PublicChurch
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: church, error } = await supabase
      .from('churches')
      .select(`
        id,
        name,
        slug,
        logo_url,
        description,
        city,
        state,
        instagram_url,
        whatsapp_url,
        youtube_channel_url
      `)
      .eq('id', churchId)
      .eq('is_public_listed', true)
      .neq('id', EKKLE_HUB_ID)
      .single()

    if (error || !church) {
      return { success: false, error: 'Igreja não encontrada' }
    }

    // Get member count
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', church.id)
      .eq('is_active', true)

    return {
      success: true,
      church: {
        ...church,
        member_count: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in getChurchById:', error)
    return { success: false, error: 'Erro ao buscar igreja' }
  }
}

/**
 * Join a church (automatic affiliation - no approval needed)
 */
export async function joinChurch(churchId: string): Promise<{
  success: boolean
  churchSlug?: string
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Você precisa estar logado' }
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Perfil não encontrado' }
    }

    // Check if user is in Ekkle Hub
    if (!isEkkleHubUser(profile)) {
      return { success: false, error: 'Você já está afiliado a uma igreja' }
    }

    // Check if target church exists and is public
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name, slug, is_public_listed')
      .eq('id', churchId)
      .single()

    if (churchError || !church) {
      return { success: false, error: 'Igreja não encontrada' }
    }

    if (!church.is_public_listed) {
      return { success: false, error: 'Esta igreja não está aceitando novos membros' }
    }

    if (churchId === EKKLE_HUB_ID) {
      return { success: false, error: 'Operação inválida' }
    }

    // Update user profile with new church
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        church_id: churchId,
        member_stage: 'VISITOR',
        cell_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error joining church:', updateError)
      return { success: false, error: 'Erro ao entrar na igreja' }
    }

    // Revalidate paths
    revalidatePath('/ekkle/membro')
    revalidatePath('/membro')

    return { success: true, churchSlug: church.slug }
  } catch (error) {
    console.error('Error in joinChurch:', error)
    return { success: false, error: 'Erro ao processar solicitação' }
  }
}

/**
 * Get available states from churches for filtering
 */
export async function getAvailableStates(): Promise<{
  success: boolean
  states?: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('churches')
      .select('state')
      .eq('is_public_listed', true)
      .neq('id', EKKLE_HUB_ID)
      .not('state', 'is', null)

    if (error) {
      return { success: false, error: 'Erro ao buscar estados' }
    }

    // Get unique states
    const states = [...new Set(data.map((d) => d.state).filter(Boolean))] as string[]
    states.sort()

    return { success: true, states }
  } catch (error) {
    console.error('Error in getAvailableStates:', error)
    return { success: false, error: 'Erro ao buscar estados' }
  }
}
