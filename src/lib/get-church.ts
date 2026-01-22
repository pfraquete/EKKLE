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
  website_settings: Record<string, unknown>
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

  if (!churchId && !churchSlug) {
    return null
  }

  // Fetch church data from database
  const supabase = await createClient()

  let query = supabase.from('churches').select('*')

  if (churchId) {
    query = query.eq('id', churchId)
  } else if (churchSlug) {
    query = query.eq('slug', churchSlug)
  } else {
    // No ID and no Slug found
    return null
  }

  const { data: church } = await query.single()

  if (!church) {
    // Fallback to headers data (only if we have at least slug/id)
    return {
      id: churchId || '',
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
