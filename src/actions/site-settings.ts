'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import {
  WebsiteSettings,
  SiteTheme,
  SiteHeader,
  SiteFooter,
  SiteSections,
  SiteSEO,
  mergeWithDefaults,
  defaultWebsiteSettings,
} from '@/types/site-settings'

// =====================================================
// GET SETTINGS
// =====================================================

export async function getWebsiteSettings(): Promise<{
  success: boolean
  data?: WebsiteSettings
  error?: string
}> {
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
      console.error('Error fetching website settings:', error)
      return { success: false, error: 'Erro ao buscar configurações' }
    }

    const rawSettings = church.website_settings as Partial<WebsiteSettings> | null
    const settings = mergeWithDefaults(rawSettings || {})

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error in getWebsiteSettings:', error)
    return { success: false, error: 'Erro ao buscar configurações' }
  }
}

// =====================================================
// UPDATE THEME
// =====================================================

export async function updateSiteTheme(theme: Partial<SiteTheme>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar o tema' }
    }

    const supabase = await createClient()

    // Get current settings
    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    // Update theme
    const updatedSettings: WebsiteSettings = {
      ...mergedSettings,
      theme: { ...mergedSettings.theme, ...theme },
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      console.error('Error updating site theme:', updateError)
      return { success: false, error: 'Erro ao salvar tema' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSiteTheme:', error)
    return { success: false, error: 'Erro ao salvar tema' }
  }
}

// =====================================================
// UPDATE HEADER
// =====================================================

export async function updateSiteHeader(header: Partial<SiteHeader>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar o cabeçalho' }
    }

    const supabase = await createClient()

    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    const updatedSettings: WebsiteSettings = {
      ...mergedSettings,
      header: { ...mergedSettings.header, ...header },
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao salvar cabeçalho' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSiteHeader:', error)
    return { success: false, error: 'Erro ao salvar cabeçalho' }
  }
}

// =====================================================
// UPDATE FOOTER
// =====================================================

export async function updateSiteFooter(footer: Partial<SiteFooter>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar o rodapé' }
    }

    const supabase = await createClient()

    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    const updatedSettings: WebsiteSettings = {
      ...mergedSettings,
      footer: { ...mergedSettings.footer, ...footer },
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao salvar rodapé' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSiteFooter:', error)
    return { success: false, error: 'Erro ao salvar rodapé' }
  }
}

// =====================================================
// UPDATE SECTIONS
// =====================================================

export async function updateSiteSections(sections: Partial<SiteSections>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar as seções' }
    }

    const supabase = await createClient()

    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    // Deep merge sections
    const updatedSections: SiteSections = {
      hero: { ...mergedSettings.sections.hero, ...sections.hero },
      cells: { ...mergedSettings.sections.cells, ...sections.cells },
      events: { ...mergedSettings.sections.events, ...sections.events },
      courses: { ...mergedSettings.sections.courses, ...sections.courses },
      about: { ...mergedSettings.sections.about, ...sections.about },
      contact: { ...mergedSettings.sections.contact, ...sections.contact },
      testimonials: { ...mergedSettings.sections.testimonials, ...sections.testimonials },
    }

    const updatedSettings: WebsiteSettings = {
      ...mergedSettings,
      sections: updatedSections,
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao salvar seções' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSiteSections:', error)
    return { success: false, error: 'Erro ao salvar seções' }
  }
}

// =====================================================
// UPDATE SEO
// =====================================================

export async function updateSiteSEO(seo: Partial<SiteSEO>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar SEO' }
    }

    const supabase = await createClient()

    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    const updatedSettings: WebsiteSettings = {
      ...mergedSettings,
      seo: { ...mergedSettings.seo, ...seo },
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao salvar SEO' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSiteSEO:', error)
    return { success: false, error: 'Erro ao salvar SEO' }
  }
}

// =====================================================
// UPDATE ALL SETTINGS
// =====================================================

export async function updateAllWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem alterar configurações' }
    }

    const supabase = await createClient()

    const { data: church } = await supabase
      .from('churches')
      .select('website_settings')
      .eq('id', profile.church_id)
      .single()

    const currentSettings = (church?.website_settings || {}) as Partial<WebsiteSettings>
    const mergedSettings = mergeWithDefaults(currentSettings)

    // Deep merge all settings
    const updatedSettings: WebsiteSettings = {
      theme: { ...mergedSettings.theme, ...settings.theme },
      header: { ...mergedSettings.header, ...settings.header },
      footer: { ...mergedSettings.footer, ...settings.footer },
      sections: {
        hero: { ...mergedSettings.sections.hero, ...settings.sections?.hero },
        cells: { ...mergedSettings.sections.cells, ...settings.sections?.cells },
        events: { ...mergedSettings.sections.events, ...settings.sections?.events },
        courses: { ...mergedSettings.sections.courses, ...settings.sections?.courses },
        about: { ...mergedSettings.sections.about, ...settings.sections?.about },
        contact: { ...mergedSettings.sections.contact, ...settings.sections?.contact },
        testimonials: { ...mergedSettings.sections.testimonials, ...settings.sections?.testimonials },
      },
      seo: { ...mergedSettings.seo, ...settings.seo },
      customCss: settings.customCss ?? mergedSettings.customCss,
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao salvar configurações' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in updateAllWebsiteSettings:', error)
    return { success: false, error: 'Erro ao salvar configurações' }
  }
}

// =====================================================
// RESET TO DEFAULTS
// =====================================================

export async function resetWebsiteSettings(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem resetar configurações' }
    }

    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        website_settings: defaultWebsiteSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.church_id)

    if (updateError) {
      return { success: false, error: 'Erro ao resetar configurações' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error in resetWebsiteSettings:', error)
    return { success: false, error: 'Erro ao resetar configurações' }
  }
}
