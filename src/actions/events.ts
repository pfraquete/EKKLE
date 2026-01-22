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
  end_time: string | null
  category: EventCategory
  image_url: string | null

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
  const churchId = profile.church_id

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...event,
      church_id: churchId,
      // Map legacy event_type if needed, or just rely on category
      event_type: ['SERVICE', 'COMMUNITY', 'OTHER'].includes(event.category) ? event.category : 'EVENT'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    throw new Error('Failed to create event')
  }

  revalidatePath('/dashboard/eventos')
  return { success: true, data }
}

export async function updateEvent(id: string, event: Partial<Omit<EventData, 'id'>>) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
  const churchId = profile.church_id

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      ...event,
      // Map legacy event_type if needed
      event_type: event.category && ['SERVICE', 'COMMUNITY', 'OTHER'].includes(event.category) ? event.category : undefined
    })
    .eq('id', id)
    .eq('church_id', churchId)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    throw new Error('Failed to update event')
  }

  revalidatePath('/dashboard/eventos')
  return { success: true, data }
}

export async function deleteEvent(id: string) {
  const profile = await getProfile()
  if (!profile) throw new Error('Not authenticated')
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
