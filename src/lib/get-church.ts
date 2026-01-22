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
  let churchSlug = headersList.get('x-church-slug')
  const churchName = headersList.get('x-church-name')

  // Fallback: try to extract slug from host if headers are missing
  if (!churchId && !churchSlug) {
    const host = headersList.get('host') || ''
    const parts = host.split('.')
    // Assuming subdomain is the first part (e.g. slug.ekkle.com.br)
    // Avoid 'www', 'app', 'localhost'
    if (parts.length > 2 && !['www', 'app', 'localhost'].includes(parts[0])) {
      churchSlug = parts[0]
    }
  }

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
    return null
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
