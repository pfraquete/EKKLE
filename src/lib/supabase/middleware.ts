import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { extractSubdomain, resolveChurchFromSubdomain, isPublicWebsiteRoute, isAdminRoute, isSuperAdminRoute } from '@/lib/tenant'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'
import { IMPERSONATION_COOKIE } from '@/lib/impersonation'

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2]

// Routes that are ALWAYS accessible (even without subscription)
const ALWAYS_ACCESSIBLE_ROUTES = [
    '/membro/perfil',
    '/membro/configuracoes',
    '/membro/biblia-oracao',  // Bíblia e Oração - sempre acessível para membros
    '/leitura-biblica',        // Leitura bíblica - sempre acessível
    '/pedidos-oracao',         // Pedidos de oração - sempre acessível
    '/ekkle/membro',
    '/assinatura-expirada',
    '/logout',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/register',
    '/registro',
    '/cadastro',
]

// Church feature routes (blocked when subscription expired)
// Note: /leitura-biblica and /pedidos-oracao moved to ALWAYS_ACCESSIBLE_ROUTES
const CHURCH_FEATURE_ROUTES = [
    '/dashboard',
    '/celulas',
    '/minha-celula',
    '/membros',
    '/financeiro',
    '/configuracoes/site',
    '/configuracoes/whatsapp',
    '/configuracoes/pix',
    '/presenca-cultos',
    '/importar',
    '/calendario',
    '/cursos',
    '/eventos',
    '/loja',
    '/transmissao',
    '/dizimos',
]

// Cache for subscription status (in-memory, per-request)
const subscriptionCache = new Map<string, { isActive: boolean; timestamp: number }>()
const SUBSCRIPTION_CACHE_TTL = 60000 // 1 minute

/**
 * Helper to redirect while preserving cookies
 */
function redirectWithCookies(url: URL, supabaseResponse: NextResponse, request: NextRequest): NextResponse {
    const redirectResponse = NextResponse.redirect(url)
    const allCookies = supabaseResponse.cookies.getAll()
    allCookies.forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
}

/**
 * Get cached subscription status or fetch from database
 */
async function getSubscriptionStatus(
    supabase: ReturnType<typeof createServerClient>,
    churchId: string
): Promise<boolean> {
    const cached = subscriptionCache.get(churchId)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < SUBSCRIPTION_CACHE_TTL) {
        return cached.isActive
    }
    
    const { data: subStatus } = await supabase
        .rpc('check_church_subscription_status', { p_church_id: churchId })
        .single()
    
    const isActive = (subStatus as { is_active: boolean } | null)?.is_active ?? false
    
    subscriptionCache.set(churchId, { isActive, timestamp: now })
    
    return isActive
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // =====================================================
    // SINGLE AUTH CHECK - Get user once
    // =====================================================
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // =====================================================
    // IMPERSONATION DETECTION
    // =====================================================
    const impersonationToken = request.cookies.get(IMPERSONATION_COOKIE)?.value
    const isImpersonating = !!impersonationToken

    if (isImpersonating) {
        supabaseResponse.headers.set('x-impersonating', 'true')
    }

    // Extract subdomain and resolve church
    const hostname = request.headers.get('host') || ''
    const subdomain = extractSubdomain(hostname)
    const church = subdomain ? await resolveChurchFromSubdomain(subdomain) : null

    // If subdomain exists but church not found, show 404
    if (subdomain && !church) {
        return new NextResponse('Igreja não encontrada', { status: 404 })
    }

    // Inject church data into request headers for use in pages/API routes
    if (church) {
        supabaseResponse.headers.set('x-church-id', church.id)
        supabaseResponse.headers.set('x-church-slug', church.slug)
        supabaseResponse.headers.set('x-church-name', church.name)
    }

    const pathname = request.nextUrl.pathname

    // =====================================================
    // EARLY EXITS - Skip heavy processing for simple routes
    // =====================================================
    const isApiRoute = pathname.startsWith('/api')
    const authRoutes = ['/login', '/forgot-password', '/reset-password', '/register', '/registro', '/cadastro']
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    const isPublicWebsite = isPublicWebsiteRoute(pathname)
    const isAdmin = isAdminRoute(pathname)
    const isSuperAdmin = isSuperAdminRoute(pathname)

    // API routes - no further processing needed
    if (isApiRoute) {
        return supabaseResponse
    }

    // Public website routes don't require authentication
    if (isPublicWebsite && church) {
        return supabaseResponse
    }

    // =====================================================
    // SINGLE PROFILE FETCH - Get profile with church info in ONE query
    // =====================================================
    let userProfile: { church_id: string | null; role: string | null; church_slug: string | null } | null = null
    
    if (user) {
        // OPTIMIZED: Single query with JOIN to get profile AND church slug
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                church_id,
                role,
                churches:church_id (slug)
            `)
            .eq('id', user.id)
            .single()
        
        if (profile) {
            userProfile = {
                church_id: profile.church_id,
                role: profile.role,
                church_slug: (profile.churches as { slug: string } | null)?.slug || null
            }
        }
    }

    // =====================================================
    // AUTO-REDIRECT TO CHURCH SUBDOMAIN
    // =====================================================
    if (!subdomain && user && userProfile) {
        const noRedirectRoutes = [
            '/login', '/logout', '/cadastro', '/registro', '/register',
            '/forgot-password', '/reset-password',
            '/api/', '/ekkle/', '/_next/', '/favicon', '/manifest'
        ]
        const shouldNotRedirect = noRedirectRoutes.some(route => pathname.startsWith(route))

        if (!shouldNotRedirect && userProfile.church_id && userProfile.church_id !== EKKLE_HUB_ID && userProfile.church_slug) {
            const redirectUrl = new URL(request.url)
            const baseHost = redirectUrl.host
                .replace('www.', '')
                .replace('app.', '')

            if (!baseHost.includes('localhost')) {
                redirectUrl.host = `${userProfile.church_slug}.${baseHost}`
                return redirectWithCookies(redirectUrl, supabaseResponse, request)
            }
        }
    }

    // =====================================================
    // SUPER ADMIN ROUTE PROTECTION
    // =====================================================
    if (isSuperAdmin) {
        if (isImpersonating) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return redirectWithCookies(url, supabaseResponse, request)
        }

        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return redirectWithCookies(url, supabaseResponse, request)
        }

        // Use already fetched profile
        if (userProfile?.role !== 'SUPER_ADMIN') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return redirectWithCookies(url, supabaseResponse, request)
        }

        return supabaseResponse
    }

    // =====================================================
    // SUBSCRIPTION CHECK - Granular access control
    // =====================================================
    if (!isAuthRoute) {
        const isAlwaysAccessible = ALWAYS_ACCESSIBLE_ROUTES.some(route =>
            pathname.startsWith(route)
        )
        const isChurchFeature = CHURCH_FEATURE_ROUTES.some(route =>
            pathname.startsWith(route)
        )

        if (isChurchFeature && !isAlwaysAccessible) {
            let churchIdToCheck: string | null = null

            if (church && church.id !== EKKLE_HUB_ID) {
                churchIdToCheck = church.id
            } else if (userProfile?.church_id && userProfile.church_id !== EKKLE_HUB_ID) {
                churchIdToCheck = userProfile.church_id
            }

            if (churchIdToCheck) {
                // OPTIMIZED: Use cached subscription status
                const isActive = await getSubscriptionStatus(supabase, churchIdToCheck)

                if (!isActive) {
                    const isPastor = userProfile?.role === 'PASTOR'
                    const isBillingPage = pathname.startsWith('/configuracoes/assinatura')

                    if (!isPastor || !isBillingPage) {
                        const url = request.nextUrl.clone()
                        url.pathname = '/assinatura-expirada'
                        return redirectWithCookies(url, supabaseResponse, request)
                    }
                }
            }
        }
    }

    // Admin routes require authentication
    if (isAdmin && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return redirectWithCookies(url, supabaseResponse, request)
    }

    // Não logado tentando acessar área protegida
    if (!user && !isAuthRoute && !isPublicWebsite) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return redirectWithCookies(url, supabaseResponse, request)
    }

    // Logado tentando acessar login
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return redirectWithCookies(url, supabaseResponse, request)
    }

    return supabaseResponse
}
