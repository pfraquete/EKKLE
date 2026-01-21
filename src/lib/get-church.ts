import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type Church = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  address: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  youtube_channel_url: string | null
  website_settings: Record<string, any>
}

/**
 * Gets the current church from request headers (injected by middleware)
 * This is for use in Server Components and Server Actions
 */
export async function getChurch(): Promise<Church | null> {
  const headersList = await headers()
  const churchId = headersList.get('x-church-id')
  const churchSlug = headersList.get('x-church-slug')
  const churchName = headersList.get('x-church-name')

  if (!churchId || !churchSlug) {
    return null
  }

  // Fetch full church data from database
  const supabase = await createClient()
  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('id', churchId)
    .single()

  if (!church) {
    // Fallback to headers data
    return {
      id: churchId,
      name: churchName || '',
      slug: churchSlug,
      logo_url: null,
      description: null,
      address: null,
      instagram_url: null,
      whatsapp_url: null,
      youtube_channel_url: null,
      website_settings: {},
    }
  }

  return church
}

/**
 * Gets church ID from headers (faster, doesn't query database)
 */
export async function getChurchId(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-church-id')
}
