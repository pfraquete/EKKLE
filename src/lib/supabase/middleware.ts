import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { extractSubdomain, resolveChurchFromSubdomain, isPublicWebsiteRoute, isAdminRoute, isSuperAdminRoute } from '@/lib/tenant'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

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

    const {
        data: { user },
    } = await supabase.auth.getUser()

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
    // AUTO-REDIRECT TO CHURCH SUBDOMAIN
    // =====================================================
    // If user is logged in, has a church, and is accessing main domain,
    // redirect them to their church's subdomain
    if (!subdomain && user) {
        // Rotas que NÃO devem redirecionar
        const noRedirectRoutes = [
            '/login', '/logout', '/cadastro', '/registro', '/register',
            '/forgot-password', '/reset-password',
            '/api/', '/ekkle/', '/_next/', '/favicon', '/manifest'
        ]
        const shouldNotRedirect = noRedirectRoutes.some(route => pathname.startsWith(route))

        if (!shouldNotRedirect) {
            // Buscar perfil do usuário para pegar church_id
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('church_id')
                .eq('id', user.id)
                .single()

            // Se tem church_id e não é Ekkle Hub, redirecionar para subdomínio
            if (userProfile?.church_id && userProfile.church_id !== EKKLE_HUB_ID) {
                // Buscar slug da igreja
                const { data: userChurch } = await supabase
                    .from('churches')
                    .select('slug')
                    .eq('id', userProfile.church_id)
                    .single()

                if (userChurch?.slug) {
                    // Construir URL de redirecionamento
                    const redirectUrl = new URL(request.url)
                    // Substituir o host pelo subdomínio da igreja
                    const baseHost = redirectUrl.host
                        .replace('www.', '')
                        .replace('app.', '')
                        .replace('localhost:3000', 'localhost:3000') // Dev

                    if (baseHost.includes('localhost')) {
                        // Dev: não redirecionar (subdomínios não funcionam em localhost)
                        // Apenas injetar headers
                    } else {
                        // Prod: redirecionar para subdomínio
                        redirectUrl.host = `${userChurch.slug}.${baseHost}`
                        return redirectWithCookies(redirectUrl, supabaseResponse, request)
                    }
                }
            }
        }
    }
    const isPublicWebsite = isPublicWebsiteRoute(pathname)
    const isAdmin = isAdminRoute(pathname)
    const isSuperAdmin = isSuperAdminRoute(pathname)

    // =====================================================
    // SUPER ADMIN ROUTE PROTECTION
    // =====================================================
    // Only users with SUPER_ADMIN role can access /admin routes
    if (isSuperAdmin) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return redirectWithCookies(url, supabaseResponse, request)
        }

        // Check if user has SUPER_ADMIN role
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'SUPER_ADMIN') {
            // Not a super admin - redirect to dashboard
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return redirectWithCookies(url, supabaseResponse, request)
        }

        // Super admin authenticated - allow access
        return supabaseResponse
    }

    // Rotas públicas (auth)
    const authRoutes = ['/login', '/forgot-password', '/reset-password', '/register', '/registro', '/cadastro']
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )
    const isApiRoute = pathname.startsWith('/api')

    // =====================================================
    // SUBSCRIPTION CHECK - Granular access control
    // =====================================================
    // Skip for: API routes, auth routes
    if (!isApiRoute && !isAuthRoute) {
        // Check if route is always accessible (profile, etc.)
        const isAlwaysAccessible = ALWAYS_ACCESSIBLE_ROUTES.some(route =>
            pathname.startsWith(route)
        )

        // Check if route is a church feature
        const isChurchFeature = CHURCH_FEATURE_ROUTES.some(route =>
            pathname.startsWith(route)
        )

        // Only check subscription for church feature routes
        if (isChurchFeature && !isAlwaysAccessible) {
            // Determine which church to check:
            // 1. If accessing via subdomain, use the church from subdomain
            // 2. If no subdomain but user is logged in, use their profile's church_id
            let churchIdToCheck: string | null = null
            let userRole: string | null = null

            if (church && church.id !== EKKLE_HUB_ID) {
                // Subdomain access - use church from subdomain
                churchIdToCheck = church.id
            }

            // Get user profile if logged in (needed for church_id when no subdomain, and for role check)
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('church_id, role')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    userRole = profile.role
                    // If no subdomain, use church from profile
                    if (!churchIdToCheck && profile.church_id && profile.church_id !== EKKLE_HUB_ID) {
                        churchIdToCheck = profile.church_id
                    }
                }
            }

            // If we have a church to check, verify subscription
            if (churchIdToCheck) {
                // Use the function that includes 3-day grace period
                const { data: subStatus } = await supabase
                    .rpc('check_church_subscription_status', { p_church_id: churchIdToCheck })
                    .single()

                const status = subStatus as { is_active: boolean } | null
                const isActive = status?.is_active ?? false

                // If subscription not active (and past grace period)
                if (!isActive) {
                    const isPastor = userRole === 'PASTOR'

                    // Pastor can access billing page even without subscription
                    const isBillingPage = pathname.startsWith('/configuracoes/assinatura')

                    if (!isPastor || !isBillingPage) {
                        // Redirect to subscription expired page
                        const url = request.nextUrl.clone()
                        url.pathname = '/assinatura-expirada'
                        return redirectWithCookies(url, supabaseResponse, request)
                    }
                }
            }
        }
    }

    // Public website routes don't require authentication
    if (isPublicWebsite && church) {
        // Allow access to public website even without auth
        return supabaseResponse
    }

    // Admin routes require authentication
    if (isAdmin && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)

        // Copy cookies from supabaseResponse (which might have refreshed session)
        const allCookies = supabaseResponse.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    // Não logado tentando acessar área protegida
    if (!user && !isAuthRoute && !isPublicWebsite && !isApiRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)

        // Copy cookies from supabaseResponse (which might have refreshed session)
        const allCookies = supabaseResponse.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    // Logado tentando acessar login
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        const redirectResponse = NextResponse.redirect(url)

        // Copy cookies from supabaseResponse
        const allCookies = supabaseResponse.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    return supabaseResponse
}
