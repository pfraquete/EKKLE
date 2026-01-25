import { headers } from 'next/headers'
import { unstable_cache } from 'next/cache'
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
 * Cached church fetch - reduces database queries
 * Cache is revalidated every 60 seconds or when the 'church' tag is invalidated
 */
const getCachedChurchById = unstable_cache(
  async (churchId: string): Promise<Church | null> => {
    const supabase = await createClient()
    const { data: church } = await supabase
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single()

    return church || null
  },
  ['church-by-id'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['church'],
  }
)

const getCachedChurchBySlug = unstable_cache(
  async (churchSlug: string): Promise<Church | null> => {
    const supabase = await createClient()
    const { data: church } = await supabase
      .from('churches')
      .select('*')
      .eq('slug', churchSlug)
      .single()

    return church || null
  },
  ['church-by-slug'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['church'],
  }
)

/**
 * Gets the current church from request headers (injected by middleware)
 * This is for use in Server Components and Server Actions
 *
 * Performance: Uses Next.js cache to reduce database queries
 */
export async function getChurch(): Promise<Church | null> {
  const headersList = await headers()
  const churchId = headersList.get('x-church-id')
  let churchSlug = headersList.get('x-church-slug')

  // Fallback: try to extract slug from host if headers are missing
  if (!churchId && !churchSlug) {
    const host = headersList.get('host') || ''
    const xForwardedHost = headersList.get('x-forwarded-host')
    const finalHost = xForwardedHost || host

    const parts = finalHost.split('.')
    // If we have a subdomain (e.g. slug.ekkle.com.br)
    if (parts.length >= 2) {
      const potentialSlug = parts[0]
      if (!['www', 'app', 'localhost', '127'].includes(potentialSlug.toLowerCase())) {
        churchSlug = potentialSlug.toLowerCase()
      }
    }
  }

  if (!churchId && !churchSlug) {
    return null
  }

  // Use cached fetch
  if (churchId) {
    return getCachedChurchById(churchId)
  }

  if (churchSlug) {
    return getCachedChurchBySlug(churchSlug)
  }

  return null
}

/**
 * Gets church ID from headers (faster, doesn't query database)
 */
export async function getChurchId(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-church-id')
}

/**
 * Invalidate church cache - call this after updating church data
 * Use in server actions that modify church data
 */
export async function invalidateChurchCache(): Promise<void> {
  // This will be called when church data is updated
  // The cache will be invalidated by the revalidateTag('church') call
  // in the server action
  console.log('[Cache] Church cache invalidation requested')
}
