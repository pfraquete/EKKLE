'use server'

import { createClient } from '@/lib/supabase/server'
import { getChurch } from '@/lib/get-church'
import { revalidatePath } from 'next/cache'

// =============================================================================
// TYPES
// =============================================================================

export interface PrayerPartner {
  partnership_id: string
  partner_id: string
  partner_name: string
  partner_photo: string | null
  week_start: string
  week_end: string
  is_new: boolean
}

export interface PrayerPartnerPreferences {
  id: string
  is_active: boolean
  preferred_gender: string | null
  preferred_age_group: string | null
  total_partnerships: number
}

export interface PartnerPrayerRequest {
  id: string
  partnership_id: string
  sender_id: string
  sender_name?: string
  sender_photo?: string | null
  content: string
  is_urgent: boolean
  is_prayed: boolean
  prayed_at: string | null
  prayed_by: string | null
  response_note: string | null
  is_answered: boolean
  answered_at: string | null
  testimony: string | null
  created_at: string
}

// =============================================================================
// GET OR CREATE WEEKLY PARTNER
// =============================================================================

export async function getWeeklyPartner(): Promise<{
  success: boolean
  partner?: PrayerPartner
  error?: string
}> {
  try {
    const supabase = await createClient()
    const church = await getChurch()

    if (!church) {
      return { success: false, error: 'Igreja nao encontrada' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    // Call the database function to get or create partner
    const { data, error } = await supabase
      .rpc('get_or_create_weekly_partner', {
        p_profile_id: user.id,
        p_church_id: church.id
      })

    if (error) {
      console.error('Error getting weekly partner:', error)
      return { success: false, error: 'Erro ao buscar parceiro' }
    }

    if (!data || data.length === 0) {
      return { success: true, partner: undefined }
    }

    return {
      success: true,
      partner: data[0] as PrayerPartner
    }
  } catch (error) {
    console.error('Error in getWeeklyPartner:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// GET PARTNER PREFERENCES
// =============================================================================

export async function getPartnerPreferences(): Promise<{
  success: boolean
  preferences?: PrayerPartnerPreferences
  error?: string
}> {
  try {
    const supabase = await createClient()
    const church = await getChurch()

    if (!church) {
      return { success: false, error: 'Igreja nao encontrada' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { data, error } = await supabase
      .from('prayer_partner_preferences')
      .select('*')
      .eq('profile_id', user.id)
      .eq('church_id', church.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting preferences:', error)
      return { success: false, error: 'Erro ao buscar preferencias' }
    }

    return {
      success: true,
      preferences: data as PrayerPartnerPreferences | undefined
    }
  } catch (error) {
    console.error('Error in getPartnerPreferences:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// UPDATE PARTNER PREFERENCES
// =============================================================================

export async function updatePartnerPreferences(
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const church = await getChurch()

    if (!church) {
      return { success: false, error: 'Igreja nao encontrada' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { error } = await supabase
      .from('prayer_partner_preferences')
      .upsert({
        profile_id: user.id,
        church_id: church.id,
        is_active: isActive,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,church_id'
      })

    if (error) {
      console.error('Error updating preferences:', error)
      return { success: false, error: 'Erro ao atualizar preferencias' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/parceiro')
    return { success: true }
  } catch (error) {
    console.error('Error in updatePartnerPreferences:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// GET PARTNERSHIP REQUESTS
// =============================================================================

export async function getPartnershipRequests(
  partnershipId: string
): Promise<{
  success: boolean
  requests?: PartnerPrayerRequest[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { data, error } = await supabase
      .from('partner_prayer_requests')
      .select(`
        *,
        sender:profiles!partner_prayer_requests_sender_id_fkey(
          full_name,
          photo_url
        )
      `)
      .eq('partnership_id', partnershipId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting requests:', error)
      return { success: false, error: 'Erro ao buscar pedidos' }
    }

    const requests = (data || []).map(req => ({
      ...req,
      sender_name: req.sender?.full_name,
      sender_photo: req.sender?.photo_url
    }))

    return { success: true, requests }
  } catch (error) {
    console.error('Error in getPartnershipRequests:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// CREATE PRAYER REQUEST
// =============================================================================

export async function createPrayerRequest(
  partnershipId: string,
  content: string,
  isUrgent: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { error } = await supabase
      .from('partner_prayer_requests')
      .insert({
        partnership_id: partnershipId,
        sender_id: user.id,
        content,
        is_urgent: isUrgent
      })

    if (error) {
      console.error('Error creating request:', error)
      return { success: false, error: 'Erro ao criar pedido' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/parceiro')
    return { success: true }
  } catch (error) {
    console.error('Error in createPrayerRequest:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// MARK REQUEST AS PRAYED
// =============================================================================

export async function markRequestAsPrayed(
  requestId: string,
  responseNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { error } = await supabase
      .from('partner_prayer_requests')
      .update({
        is_prayed: true,
        prayed_at: new Date().toISOString(),
        prayed_by: user.id,
        response_note: responseNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error marking as prayed:', error)
      return { success: false, error: 'Erro ao marcar como orado' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/parceiro')
    return { success: true }
  } catch (error) {
    console.error('Error in markRequestAsPrayed:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// MARK REQUEST AS ANSWERED
// =============================================================================

export async function markRequestAsAnswered(
  requestId: string,
  testimony?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { error } = await supabase
      .from('partner_prayer_requests')
      .update({
        is_answered: true,
        answered_at: new Date().toISOString(),
        testimony: testimony || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('sender_id', user.id) // Only the sender can mark as answered

    if (error) {
      console.error('Error marking as answered:', error)
      return { success: false, error: 'Erro ao marcar como respondido' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/parceiro')
    return { success: true }
  } catch (error) {
    console.error('Error in markRequestAsAnswered:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =============================================================================
// GET PARTNERSHIP HISTORY
// =============================================================================

export async function getPartnershipHistory(): Promise<{
  success: boolean
  partnerships?: Array<{
    id: string
    partner_name: string
    partner_photo: string | null
    week_start: string
    week_end: string
    requests_shared: number
    status: string
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    const church = await getChurch()

    if (!church) {
      return { success: false, error: 'Igreja nao encontrada' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' }
    }

    const { data, error } = await supabase
      .from('prayer_partnerships')
      .select(`
        id,
        week_start,
        week_end,
        requests_shared,
        status,
        partner_a:profiles!prayer_partnerships_partner_a_id_fkey(id, full_name, photo_url),
        partner_b:profiles!prayer_partnerships_partner_b_id_fkey(id, full_name, photo_url)
      `)
      .eq('church_id', church.id)
      .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
      .order('week_start', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error getting history:', error)
      return { success: false, error: 'Erro ao buscar historico' }
    }

    type PartnerProfile = { id: string; full_name: string; photo_url: string | null }

    const partnerships = (data || []).map(p => {
      // Handle both array and object formats from Supabase
      const partnerAData = p.partner_a as unknown
      const partnerBData = p.partner_b as unknown
      const partnerA = (Array.isArray(partnerAData) ? partnerAData[0] : partnerAData) as PartnerProfile | null
      const partnerB = (Array.isArray(partnerBData) ? partnerBData[0] : partnerBData) as PartnerProfile | null
      const partner = partnerA?.id === user.id ? partnerB : partnerA
      return {
        id: p.id,
        partner_name: partner?.full_name || 'Parceiro',
        partner_photo: partner?.photo_url || null,
        week_start: p.week_start,
        week_end: p.week_end,
        requests_shared: p.requests_shared,
        status: p.status
      }
    })

    return { success: true, partnerships }
  } catch (error) {
    console.error('Error in getPartnershipHistory:', error)
    return { success: false, error: 'Erro interno' }
  }
}
