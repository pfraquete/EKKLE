'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const churchConfigSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  instagram_url: z.string().url().optional().or(z.literal('')),
  whatsapp_url: z.string().url().optional().or(z.literal('')),
  youtube_channel_url: z.string().url().optional().or(z.literal('')),
})

type ChurchConfigInput = z.infer<typeof churchConfigSchema>

export async function updateChurchConfig(data: ChurchConfigInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem alterar configurações')
    }

    // Validate input
    const validated = churchConfigSchema.parse(data)

    const supabase = await createClient()

    // Check if slug is already taken (by another church)
    if (validated.slug) {
      const { data: existingChurch } = await supabase
        .from('churches')
        .select('id')
        .eq('slug', validated.slug)
        .neq('id', profile.church_id)
        .single()

      if (existingChurch) {
        throw new Error('Este slug já está em uso por outra igreja')
      }
    }

    // Update church
    const { error } = await supabase
      .from('churches')
      .update({
        name: validated.name,
        slug: validated.slug || null,
        description: validated.description || null,
        address: validated.address || null,
        logo_url: validated.logo_url || null,
        instagram_url: validated.instagram_url || null,
        whatsapp_url: validated.whatsapp_url || null,
        youtube_channel_url: validated.youtube_channel_url || null,
      })
      .eq('id', profile.church_id)

    if (error) {
      throw new Error('Erro ao atualizar configurações')
    }

    revalidatePath('/configuracoes/site')
    revalidatePath('/', 'layout') // Revalidate all public pages

    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating church config:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}
