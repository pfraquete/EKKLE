'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface ParentalConsent {
  id: string
  event_id: string
  child_id: string
  church_id: string
  parent_name: string
  parent_cpf: string | null
  parent_phone: string | null
  parent_email: string | null
  relationship: string | null
  consent_given: boolean
  consent_date: string | null
  consent_signature_url: string | null
  medical_notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  allows_photos: boolean
  allows_transportation: boolean
  allows_swimming: boolean
  allows_medication: boolean
  medication_instructions: string | null
  checked_in_at: string | null
  checked_in_by: string | null
  checked_out_at: string | null
  checked_out_by: string | null
  checkout_person_name: string | null
  checkout_person_document: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  child?: {
    id: string
    full_name: string
    birth_date: string
    photo_url: string | null
    medical_info: string | null
    allergies: string | null
  }
  event?: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
  checked_in_by_profile?: { full_name: string }
  checked_out_by_profile?: { full_name: string }
}

export interface EventKidsStats {
  event_id: string
  event_name: string
  total_registrations: number
  authorized_count: number
  pending_count: number
  checked_in_count: number
  checked_out_count: number
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createConsentSchema = z.object({
  event_id: z.string().uuid(),
  child_id: z.string().uuid(),
  parent_name: z.string().min(2, 'Nome do responsável é obrigatório'),
  parent_cpf: z.string().optional().nullable(),
  parent_phone: z.string().optional().nullable(),
  parent_email: z.string().email().optional().nullable(),
  relationship: z.string().optional().nullable(),
  medical_notes: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  allows_photos: z.boolean().default(true),
  allows_transportation: z.boolean().default(true),
  allows_swimming: z.boolean().default(false),
  allows_medication: z.boolean().default(false),
  medication_instructions: z.string().optional().nullable(),
})

const checkInOutSchema = z.object({
  consent_id: z.string().uuid(),
  person_name: z.string().optional(),
  person_document: z.string().optional(),
  notes: z.string().optional(),
})

// =====================================================
// HELPER: Check Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTOR']) {
  const profile = await getProfile()
  if (!profile) {
    return { error: 'Não autenticado', profile: null }
  }

  if (profile.role === 'PASTOR') {
    return { error: null, profile }
  }

  if (requiredRoles.includes(profile.kids_role || '')) {
    return { error: null, profile }
  }

  return { error: 'Sem permissão para esta ação', profile: null }
}

// =====================================================
// PARENTAL CONSENTS
// =====================================================

/**
 * Get all consents for an event
 */
export async function getEventConsents(eventId: string): Promise<ParentalConsent[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_parental_consents')
    .select(`
      *,
      child:kids_children(id, full_name, birth_date, photo_url, medical_info, allergies),
      checked_in_by_profile:profiles!event_parental_consents_checked_in_by_fkey(full_name),
      checked_out_by_profile:profiles!event_parental_consents_checked_out_by_fkey(full_name)
    `)
    .eq('event_id', eventId)
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event consents:', error)
    return []
  }

  return data as unknown as ParentalConsent[]
}

/**
 * Get consent by ID
 */
export async function getConsentById(id: string): Promise<ParentalConsent | null> {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_parental_consents')
    .select(`
      *,
      child:kids_children(id, full_name, birth_date, photo_url, medical_info, allergies),
      event:events(id, name, start_date, end_date),
      checked_in_by_profile:profiles!event_parental_consents_checked_in_by_fkey(full_name),
      checked_out_by_profile:profiles!event_parental_consents_checked_out_by_fkey(full_name)
    `)
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching consent:', error)
    return null
  }

  return data as unknown as ParentalConsent
}

/**
 * Create a new parental consent
 */
export async function createParentalConsent(data: z.infer<typeof createConsentSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = createConsentSchema.parse(data)
    const supabase = await createClient()

    const { data: consent, error } = await supabase
      .from('event_parental_consents')
      .insert({
        ...validated,
        church_id: profile.church_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Esta criança já está inscrita neste evento' }
      }
      console.error('Error creating consent:', error)
      return { success: false, error: 'Erro ao criar autorização' }
    }

    revalidatePath('/eventos')
    return { success: true, data: consent }
  } catch (error) {
    console.error('Error in createParentalConsent:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar autorização' }
  }
}

/**
 * Update parental consent
 */
export async function updateParentalConsent(id: string, data: Partial<z.infer<typeof createConsentSchema>>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { data: consent, error } = await supabase
      .from('event_parental_consents')
      .update(data)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating consent:', error)
      return { success: false, error: 'Erro ao atualizar autorização' }
    }

    revalidatePath('/eventos')
    return { success: true, data: consent }
  } catch (error) {
    console.error('Error in updateParentalConsent:', error)
    return { success: false, error: 'Erro ao atualizar autorização' }
  }
}

/**
 * Approve consent (mark as authorized)
 */
export async function approveConsent(id: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('event_parental_consents')
      .update({
        consent_given: true,
        consent_date: new Date().toISOString(),
        status: 'approved',
      })
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error approving consent:', error)
      return { success: false, error: 'Erro ao aprovar autorização' }
    }

    revalidatePath('/eventos')
    return { success: true }
  } catch (error) {
    console.error('Error in approveConsent:', error)
    return { success: false, error: 'Erro ao aprovar autorização' }
  }
}

/**
 * Reject consent
 */
export async function rejectConsent(id: string, reason?: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('event_parental_consents')
      .update({
        status: 'rejected',
        notes: reason || null,
      })
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error rejecting consent:', error)
      return { success: false, error: 'Erro ao rejeitar autorização' }
    }

    revalidatePath('/eventos')
    return { success: true }
  } catch (error) {
    console.error('Error in rejectConsent:', error)
    return { success: false, error: 'Erro ao rejeitar autorização' }
  }
}

// =====================================================
// CHECK-IN / CHECK-OUT
// =====================================================

/**
 * Check-in a child at an event
 */
export async function checkInChild(data: z.infer<typeof checkInOutSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = checkInOutSchema.parse(data)
    const supabase = await createClient()

    // Check if consent is approved
    const { data: consent } = await supabase
      .from('event_parental_consents')
      .select('status, consent_given')
      .eq('id', validated.consent_id)
      .single()

    if (!consent?.consent_given || consent.status !== 'approved') {
      return { success: false, error: 'Autorização não aprovada. Não é possível fazer check-in.' }
    }

    // Update consent with check-in info
    const { error: updateError } = await supabase
      .from('event_parental_consents')
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: profile.id,
      })
      .eq('id', validated.consent_id)
      .eq('church_id', profile.church_id)

    if (updateError) {
      console.error('Error checking in:', updateError)
      return { success: false, error: 'Erro ao fazer check-in' }
    }

    // Log the action
    await supabase.from('event_attendance_log').insert({
      consent_id: validated.consent_id,
      action_type: 'check_in',
      action_date: new Date().toISOString().split('T')[0],
      performed_by: profile.id,
      notes: validated.notes || null,
    })

    revalidatePath('/eventos')
    return { success: true }
  } catch (error) {
    console.error('Error in checkInChild:', error)
    return { success: false, error: 'Erro ao fazer check-in' }
  }
}

/**
 * Check-out a child from an event
 */
export async function checkOutChild(data: z.infer<typeof checkInOutSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = checkInOutSchema.parse(data)
    const supabase = await createClient()

    // Require person info for checkout
    if (!validated.person_name) {
      return { success: false, error: 'Nome de quem está buscando é obrigatório' }
    }

    // Update consent with check-out info
    const { error: updateError } = await supabase
      .from('event_parental_consents')
      .update({
        checked_out_at: new Date().toISOString(),
        checked_out_by: profile.id,
        checkout_person_name: validated.person_name,
        checkout_person_document: validated.person_document || null,
      })
      .eq('id', validated.consent_id)
      .eq('church_id', profile.church_id)

    if (updateError) {
      console.error('Error checking out:', updateError)
      return { success: false, error: 'Erro ao fazer check-out' }
    }

    // Log the action
    await supabase.from('event_attendance_log').insert({
      consent_id: validated.consent_id,
      action_type: 'check_out',
      action_date: new Date().toISOString().split('T')[0],
      performed_by: profile.id,
      person_name: validated.person_name,
      person_document: validated.person_document || null,
      notes: validated.notes || null,
    })

    revalidatePath('/eventos')
    return { success: true }
  } catch (error) {
    console.error('Error in checkOutChild:', error)
    return { success: false, error: 'Erro ao fazer check-out' }
  }
}

/**
 * Get attendance log for a consent
 */
export async function getAttendanceLog(consentId: string) {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_attendance_log')
    .select(`
      *,
      performed_by_profile:profiles!event_attendance_log_performed_by_fkey(full_name)
    `)
    .eq('consent_id', consentId)
    .order('action_time', { ascending: false })

  if (error) {
    console.error('Error fetching attendance log:', error)
    return []
  }

  return data
}

// =====================================================
// KIDS EVENTS
// =====================================================

/**
 * Get kids events (events with is_kids_event = true)
 */
export async function getKidsEvents() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_kids_event', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching kids events:', error)
    return []
  }

  return data
}

/**
 * Get event statistics
 */
export async function getEventKidsStats(eventId: string): Promise<EventKidsStats | null> {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', eventId)
    .single()

  if (!event) return null

  const { data: consents } = await supabase
    .from('event_parental_consents')
    .select('id, consent_given, checked_in_at, checked_out_at')
    .eq('event_id', eventId)

  const stats: EventKidsStats = {
    event_id: event.id,
    event_name: event.name,
    total_registrations: consents?.length || 0,
    authorized_count: consents?.filter(c => c.consent_given).length || 0,
    pending_count: consents?.filter(c => !c.consent_given).length || 0,
    checked_in_count: consents?.filter(c => c.checked_in_at).length || 0,
    checked_out_count: consents?.filter(c => c.checked_out_at).length || 0,
  }

  return stats
}

/**
 * Bulk register children for an event
 */
export async function bulkRegisterChildrenForEvent(eventId: string, childIds: string[]) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Get children data
    const { data: children } = await supabase
      .from('kids_children')
      .select('id, parent_name, parent_phone, parent_email')
      .in('id', childIds)

    if (!children || children.length === 0) {
      return { success: false, error: 'Nenhuma criança encontrada' }
    }

    // Create consents
    const consents = children.map(child => ({
      event_id: eventId,
      child_id: child.id,
      church_id: profile.church_id,
      parent_name: child.parent_name || 'Responsável',
      parent_phone: child.parent_phone,
      parent_email: child.parent_email,
      status: 'pending' as const,
    }))

    const { error } = await supabase
      .from('event_parental_consents')
      .upsert(consents, { onConflict: 'event_id,child_id' })

    if (error) {
      console.error('Error bulk registering:', error)
      return { success: false, error: 'Erro ao registrar crianças' }
    }

    revalidatePath('/eventos')
    return { success: true, count: children.length }
  } catch (error) {
    console.error('Error in bulkRegisterChildrenForEvent:', error)
    return { success: false, error: 'Erro ao registrar crianças' }
  }
}

/**
 * Export consents to PDF data
 */
export async function getConsentsForExport(eventId: string) {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  const { data: consents } = await supabase
    .from('event_parental_consents')
    .select(`
      *,
      child:kids_children(id, full_name, birth_date, photo_url, medical_info, allergies)
    `)
    .eq('event_id', eventId)
    .eq('church_id', profile.church_id)
    .order('child(full_name)', { ascending: true })

  return {
    event,
    consents,
    exportedAt: new Date().toISOString(),
    exportedBy: profile.full_name,
  }
}
