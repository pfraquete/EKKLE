'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { getDefaultHomepageSettings } from '@/lib/branding-constants'

// =====================================================
// TYPES
// =====================================================

export interface HomepageSettings {
  hero?: {
    enabled: boolean
    title: string
    subtitle: string
    backgroundUrl?: string
    cta?: {
      text: string
      link: string
    }
  }
  sections?: {
    events?: { enabled: boolean; order: number }
    courses?: { enabled: boolean; order: number }
    store?: { enabled: boolean; order: number }
    about?: { enabled: boolean; order: number }
  }
}

// =====================================================
// ACTIONS
// =====================================================

/**
 * Get homepage settings for the current church
 */
export async function getHomepageSettings() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()
    const { data: church, error } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    if (error) {
      console.error('Error fetching homepage settings:', error)
      return { success: false, error: 'Erro ao buscar configurações' }
    }

    // Extract homepage settings from website_settings JSONB
    const websiteSettings = (church.website_settings || {}) as Record<string, unknown>
    const homepageSettings = (websiteSettings.homepage || getDefaultHomepageSettings()) as HomepageSettings

    return { success: true, data: homepageSettings }
  } catch (error) {
    console.error('Error in getHomepageSettings:', error)
    return { success: false, error: 'Erro ao buscar configurações' }
  }
}

/**
 * Update homepage settings for the current church
 * Only PASTOR role can update
 */
export async function updateHomepageSettings(settings: HomepageSettings) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar a homepage' }
    }

    const supabase = await createClient()

    // Get current website_settings
    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Record<string, unknown>

    // Merge homepage settings into website_settings
    const updatedSettings = {
      ...currentSettings,
      homepage: settings,
    }

    // Update database
    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      console.error('Error updating homepage settings:', updateError)
      return { success: false, error: 'Erro ao salvar configurações' }
    }

    // Revalidate homepage
    revalidatePath('/', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error in updateHomepageSettings:', error)
    return { success: false, error: 'Erro ao salvar configurações' }
  }
}

/**
 * Upload hero background image
 */
export async function uploadHeroBackground(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem fazer upload' }
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo inválido. Use PNG, JPG ou WebP' }
    }

    // Validate file size (5MB max for hero images)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 5MB' }
    }

    const supabase = await createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${profile.church_id}/hero-${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('church-assets')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading hero background:', uploadError)
      return { success: false, error: 'Erro ao fazer upload da imagem' }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('church-assets')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrlData.publicUrl }
  } catch (error) {
    console.error('Error in uploadHeroBackground:', error)
    return { success: false, error: 'Erro ao fazer upload da imagem' }
  }
}
