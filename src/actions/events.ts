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
