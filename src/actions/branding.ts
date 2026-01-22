'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export interface BrandingSettings {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  fonts?: {
    heading?: string
    body?: string
  }
  logo?: {
    url?: string
    favicon_url?: string
  }
}

// =====================================================
// ACTIONS
// =====================================================

/**
 * Get branding settings for the current church
 */
export async function getBrandingSettings() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()
    const { data: church, error } = await supabase
      .from('churches')
      .select('website_settings, logo_url')
      .eq('id', profile.church_id)
      .single()

    if (error) {
      console.error('Error fetching branding settings:', error)
      return { success: false, error: 'Erro ao buscar configurações' }
    }

    // Parse website_settings JSONB
    const settings = (church.website_settings || {}) as BrandingSettings

    // Merge with logo_url from church table
    if (church.logo_url && !settings.logo?.url) {
      settings.logo = {
        ...settings.logo,
        url: church.logo_url,
      }
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error in getBrandingSettings:', error)
    return { success: false, error: 'Erro ao buscar configurações' }
  }
}

/**
 * Update branding settings for the current church
 * Only PASTOR role can update branding
 */
export async function updateBrandingSettings(settings: BrandingSettings) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar o branding' }
    }

    const supabase = await createClient()

    // Update website_settings JSONB field
    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: settings,
        // Also update logo_url for backward compatibility
        logo_url: settings.logo?.url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      console.error('Error updating branding settings:', updateError)
      return { success: false, error: 'Erro ao salvar configurações' }
    }

    // Revalidate all pages to apply new branding
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in updateBrandingSettings:', error)
    return { success: false, error: 'Erro ao salvar configurações' }
  }
}

/**
 * Upload file to Supabase Storage
 * Used for logo and favicon uploads
 */
export async function uploadBrandingFile(
  file: File,
  type: 'logo' | 'favicon'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem fazer upload' }
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo inválido. Use PNG, JPG, SVG ou WebP' }
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 2MB' }
    }

    const supabase = await createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${profile.church_id}/${type}-${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('church-assets')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: 'Erro ao fazer upload do arquivo' }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('church-assets')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrlData.publicUrl }
  } catch (error) {
    console.error('Error in uploadBrandingFile:', error)
    return { success: false, error: 'Erro ao fazer upload do arquivo' }
  }
}

/**
 * Get available font options
 */
export function getAvailableFonts() {
  return {
    heading: [
      { value: 'Inter', label: 'Inter (Moderno)' },
      { value: 'Poppins', label: 'Poppins (Elegante)' },
      { value: 'Montserrat', label: 'Montserrat (Profissional)' },
      { value: 'Roboto', label: 'Roboto (Limpo)' },
      { value: 'Open Sans', label: 'Open Sans (Amigável)' },
      { value: 'Lato', label: 'Lato (Versátil)' },
      { value: 'Playfair Display', label: 'Playfair Display (Clássico)' },
      { value: 'Merriweather', label: 'Merriweather (Tradicional)' },
    ],
    body: [
      { value: 'Inter', label: 'Inter (Moderno)' },
      { value: 'Open Sans', label: 'Open Sans (Legível)' },
      { value: 'Roboto', label: 'Roboto (Neutro)' },
      { value: 'Lato', label: 'Lato (Suave)' },
      { value: 'Source Sans Pro', label: 'Source Sans Pro (Profissional)' },
      { value: 'Nunito', label: 'Nunito (Amigável)' },
      { value: 'PT Sans', label: 'PT Sans (Limpo)' },
      { value: 'Raleway', label: 'Raleway (Elegante)' },
    ],
  }
}

/**
 * Get default branding settings
 */
export function getDefaultBrandingSettings(): BrandingSettings {
  return {
    colors: {
      primary: '#4F46E5', // Indigo-600
      secondary: '#10B981', // Green-500
      accent: '#F59E0B', // Amber-500
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    logo: {
      url: undefined,
      favicon_url: undefined,
    },
  }
}
