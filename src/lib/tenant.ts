import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// Reserved subdomains that cannot be used for churches
const RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'auth', 'dev', 'staging', 'test']

// In-memory cache for church data (reduces database queries in middleware)
const churchCache = new Map<string, { church: ChurchData | null; timestamp: number }>()
const CHURCH_CACHE_TTL = 300000 // 5 minutes

interface ChurchData {
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
 * Extracts the subdomain from the hostname
 * Examples:
 * - minhaigreja.ekkle.com.br -> minhaigreja
 * - www.ekkle.com.br -> null (reserved)
 * - ekkle.com.br -> null (root domain)
 * - localhost:3000 -> null (development)
 */
export function extractSubdomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0].toLowerCase()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    let rootDomain: string | null = null

    if (appUrl) {
        try {
            rootDomain = new URL(appUrl).hostname.toLowerCase()
        } catch {
            rootDomain = null
        }
    }

    // Development environment (localhost)
    if (host === 'localhost' || host === '127.0.0.1') {
        return null
    }

    if (rootDomain) {
        if (host === rootDomain) {
            return null
        }

        if (host.endsWith(`.${rootDomain}`)) {
            const subdomain = host.slice(0, -(rootDomain.length + 1))
            if (!subdomain) {
                return null
            }

            const normalizedSubdomain = subdomain.split('.')[0]
            if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain.toLowerCase())) {
                return null
            }

            return normalizedSubdomain.toLowerCase()
        }
    }

    // Split hostname into parts
    const parts = host.split('.')

    // If less than 3 parts, it's likely the root domain (e.g., ekkle.com)
    // or a TLD (e.g., localhost)
    if (parts.length < 3) {
        return null
    }

    // The subdomain is the first part
    const subdomain = parts[0]

    // Check if it's a reserved subdomain
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null
    }

    return subdomain.toLowerCase()
}

/**
 * Resolves the church from the subdomain with in-memory caching
 * Returns church data if found, null otherwise
 * 
 * OPTIMIZED: Uses in-memory cache to reduce database queries
 */
export async function resolveChurchFromSubdomain(subdomain: string | null): Promise<ChurchData | null> {
    if (!subdomain) {
        return null
    }

    // Check cache first
    const cached = churchCache.get(subdomain)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CHURCH_CACHE_TTL) {
        return cached.church
    }

    // Create Supabase client with service role for public church lookup
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // Fetch church by slug
    const { data: church, error } = await supabase
        .from('churches')
        .select('id, name, slug, logo_url, description, address, instagram_url, whatsapp_url, youtube_channel_url, website_settings')
        .eq('slug', subdomain)
        .single()

    if (error || !church) {
        // Cache negative result too (prevents repeated queries for invalid subdomains)
        churchCache.set(subdomain, { church: null, timestamp: now })
        return null
    }

    // Cache the result
    churchCache.set(subdomain, { church, timestamp: now })

    return church
}

/**
 * Gets the tenant context from the request
 * This reads the church data injected by the middleware
 */
export function getTenantFromHeaders(request: NextRequest) {
    const churchId = request.headers.get('x-church-id')
    const churchSlug = request.headers.get('x-church-slug')
    const churchName = request.headers.get('x-church-name')

    if (!churchId || !churchSlug) {
        return null
    }

    return {
        id: churchId,
        slug: churchSlug,
        name: churchName || '',
    }
}

/**
 * Checks if the current route is a public church website route
 * (as opposed to the admin dashboard)
 */
export function isPublicWebsiteRoute(pathname: string): boolean {
    // Public website routes start with /site or are the root for subdomains
    return pathname.startsWith('/site') ||
        pathname === '/' ||
        pathname.startsWith('/eventos') ||
        pathname.startsWith('/cursos') ||
        pathname.startsWith('/cultos') ||
        pathname.startsWith('/sobre') ||
        pathname.startsWith('/membro') ||
        pathname.startsWith('/termos') ||
        pathname.startsWith('/privacidade')
}

/**
 * Checks if the current route is an admin dashboard route
 */
export function isAdminRoute(pathname: string): boolean {
    return pathname.startsWith('/dashboard') ||
        pathname.startsWith('/celulas') ||
        pathname.startsWith('/membros') ||
        pathname.startsWith('/minha-celula') ||
        pathname.startsWith('/calendario') ||
        pathname.startsWith('/importar') ||
        pathname.startsWith('/configuracoes')
}

/**
 * Checks if the current route is a super admin route
 */
export function isSuperAdminRoute(pathname: string): boolean {
    return pathname.startsWith('/admin')
}

/**
 * Invalidate church cache - call when church data is updated
 */
export function invalidateChurchCache(slug?: string): void {
    if (slug) {
        churchCache.delete(slug)
    } else {
        churchCache.clear()
    }
}
