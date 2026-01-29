'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export type EventCategory = 'EVENT' | 'COURSE' | 'PRAYER_CAMPAIGN' | 'SERVICE' | 'COMMUNITY' | 'OTHER'

export interface EventData {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string | null
  end_time?: string | null // Keep for form compatibility
  category: EventCategory
  image_url: string | null
  is_published: boolean

  // Advanced options
  requires_registration: boolean
  is_paid: boolean
  price: number | null
  capacity: number | null
  is_online: boolean
  online_url: string | null
  registration_link: string | null
  recurrence_pattern: string | null
}

export async function getEvents() {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  const churchId = profile.church_id

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return (data || []) as EventData[]
}

export async function getEvent(id: string) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  const churchId = profile.church_id

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (error) return null

  return data as EventData
}

export async function createEvent(event: Omit<EventData, 'id'>) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    throw new Error('Acesso não autorizado')
  }
  const churchId = profile.church_id

  const supabase = await createClient()

  // Prepare data for insertion, removing fields that don't exist in DB
  const { end_time, ...insertData } = event as any

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...insertData,
      church_id: churchId,
      created_by: profile.id,
      // end_date logic: if end_time exists, we could combine it with start_date, 
      // but for now let's just ensure we don't send end_time which doesn't exist
      end_date: end_time ? `${event.start_date.split('T')[0]}T${end_time}` : null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    throw new Error(`Failed to create event: ${error.message}`)
  }

  revalidatePath('/dashboard/eventos')
  return { success: true, data }
}

export async function updateEvent(id: string, event: Partial<Omit<EventData, 'id'>>) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    throw new Error('Acesso não autorizado')
  }
  const churchId = profile.church_id

  const supabase = await createClient()

  const { end_time, ...updateData } = event as any

  // Prepare update payload
  const payload: any = { ...updateData }
  if (end_time !== undefined) {
    const startDate = updateData.start_date || (await getEvent(id))?.start_date
    if (startDate && end_time) {
      payload.end_date = `${startDate.split('T')[0]}T${end_time}`
    } else if (end_time === null) {
      payload.end_date = null
    }
  }

  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .eq('church_id', churchId)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    throw new Error(`Failed to update event: ${error.message}`)
  }

  revalidatePath('/dashboard/eventos')
  return { success: true, data }
}

// Get published events for members (events they can register for)
export async function getPublishedEvents() {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  const churchId = profile.church_id

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Get upcoming published events
  const { data: upcomingEvents, error: upcomingError } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .eq('is_published', true)
    .gte('start_date', now)
    .order('start_date', { ascending: true })

  // Get past published events (limited)
  const { data: pastEvents, error: pastError } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .eq('is_published', true)
    .lt('start_date', now)
    .order('start_date', { ascending: false })
    .limit(6)

  if (upcomingError) {
    console.error('Error fetching upcoming events:', upcomingError)
  }
  if (pastError) {
    console.error('Error fetching past events:', pastError)
  }

  return {
    upcoming: (upcomingEvents || []) as EventData[],
    past: (pastEvents || []) as EventData[]
  }
}

// Toggle event publication status
export async function toggleEventPublished(id: string, isPublished: boolean) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    throw new Error('Acesso não autorizado')
  }
  const churchId = profile.church_id

  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .update({ is_published: isPublished })
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    console.error('Error toggling event publication:', error)
    throw new Error('Failed to update event')
  }

  revalidatePath('/dashboard/eventos')
  revalidatePath('/membro/eventos')
  return { success: true }
}

export async function deleteEvent(id: string) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    throw new Error('Acesso não autorizado')
  }
  const churchId = profile.church_id

  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    console.error('Error deleting event:', error)
    throw new Error('Failed to delete event')
  }

  revalidatePath('/dashboard/eventos')
  return { success: true }
}
