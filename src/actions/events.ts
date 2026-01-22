'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean().default(false),
})

type EventInput = z.infer<typeof eventSchema>

export async function createEvent(data: EventInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão para criar eventos')
    }

    const validated = eventSchema.parse(data)

    const supabase = await createClient()

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...validated,
        church_id: profile.church_id,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar evento')
    }

    revalidatePath('/dashboard/eventos')
    revalidatePath('/', 'layout') // Revalidate public pages

    return { success: true, event }
  } catch (error: unknown) {
    console.error('Error creating event:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function updateEvent(eventId: string, data: EventInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão para editar eventos')
    }

    const validated = eventSchema.parse(data)

    const supabase = await createClient()

    // Verify event belongs to church
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('church_id', profile.church_id)
      .single()

    if (!existingEvent) {
      throw new Error('Evento não encontrado')
    }

    const { error } = await supabase
      .from('events')
      .update(validated)
      .eq('id', eventId)

    if (error) {
      throw new Error('Erro ao atualizar evento')
    }

    revalidatePath('/dashboard/eventos')
    revalidatePath(`/dashboard/eventos/${eventId}`)
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating event:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem excluir eventos')
    }

    const supabase = await createClient()

    // Verify event belongs to church
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('church_id', profile.church_id)
      .single()

    if (!existingEvent) {
      throw new Error('Evento não encontrado')
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId)

    if (error) {
      throw new Error('Erro ao excluir evento')
    }

    revalidatePath('/dashboard/eventos')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting event:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function getEvents() {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error('Erro ao buscar eventos')
    }

    return events || []
  } catch (error) {
    console.error('Error getting events:', error)
    return []
  }
}

export async function getEvent(eventId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('church_id', profile.church_id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar evento')
    }

    return event
  } catch (error) {
    console.error('Error getting event:', error)
    return null
  }
}
