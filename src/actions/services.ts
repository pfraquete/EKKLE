'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const serviceSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  service_date: z.string().min(1, 'Data é obrigatória'),
  service_time: z.string().min(1, 'Horário é obrigatório'),
  type: z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']),
  location: z.string().optional(),
  youtube_url: z.string().url().optional().or(z.literal('')),
  zoom_meeting_id: z.string().optional(),
  zoom_password: z.string().optional(),
  is_published: z.boolean().default(false),
})

type ServiceInput = z.infer<typeof serviceSchema>

export async function createService(data: ServiceInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão para criar cultos')
    }

    const validated = serviceSchema.parse(data)

    const supabase = await createClient()

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        ...validated,
        church_id: profile.church_id,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar culto')
    }

    revalidatePath('/dashboard/cultos')
    revalidatePath('/', 'layout')

    return { success: true, service }
  } catch (error: any) {
    console.error('Error creating service:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
  }
}

export async function updateService(serviceId: string, data: ServiceInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão para editar cultos')
    }

    const validated = serviceSchema.parse(data)

    const supabase = await createClient()

    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('church_id', profile.church_id)
      .single()

    if (!existingService) {
      throw new Error('Culto não encontrado')
    }

    const { error } = await supabase
      .from('services')
      .update(validated)
      .eq('id', serviceId)

    if (error) {
      throw new Error('Erro ao atualizar culto')
    }

    revalidatePath('/dashboard/cultos')
    revalidatePath(`/dashboard/cultos/${serviceId}`)
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating service:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteService(serviceId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem excluir cultos')
    }

    const supabase = await createClient()

    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('church_id', profile.church_id)
      .single()

    if (!existingService) {
      throw new Error('Culto não encontrado')
    }

    const { error } = await supabase.from('services').delete().eq('id', serviceId)

    if (error) {
      throw new Error('Erro ao excluir culto')
    }

    revalidatePath('/dashboard/cultos')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return { success: false, error: error.message }
  }
}

export async function getServices() {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('service_date', { ascending: false })

    if (error) {
      throw new Error('Erro ao buscar cultos')
    }

    return services || []
  } catch (error) {
    console.error('Error getting services:', error)
    return []
  }
}

export async function getService(serviceId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('church_id', profile.church_id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar culto')
    }

    return service
  } catch (error) {
    console.error('Error getting service:', error)
    return null
  }
}
