import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { extractSubdomain, resolveChurchFromSubdomain, isPublicWebsiteRoute, isAdminRoute } from '@/lib/tenant'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2]

// Routes that are ALWAYS accessible (even without subscription)
const ALWAYS_ACCESSIBLE_ROUTES = [
    '/membro/perfil',
    '/membro/configuracoes',
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
    '/leitura-biblica',
    '/pedidos-oracao',
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
    const isPublicWebsite = isPublicWebsiteRoute(pathname)
    const isAdmin = isAdminRoute(pathname)

    // Rotas públicas (auth)
    const authRoutes = ['/login', '/forgot-password', '/reset-password', '/register', '/registro', '/cadastro']
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )
    const isApiRoute = pathname.startsWith('/api')

    // =====================================================
    // SUBSCRIPTION CHECK - Granular access control
    // =====================================================
    // Skip for: API routes, auth routes, Ekkle Hub
    if (church && church.id !== EKKLE_HUB_ID && !isApiRoute && !isAuthRoute) {
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
            // Use the new function that includes 3-day grace period
            const { data: subStatus } = await supabase
                .rpc('check_church_subscription_status', { p_church_id: church.id })
                .single()

            const status = subStatus as { is_active: boolean } | null
            const isActive = status?.is_active ?? false

            // If subscription not active (and past grace period)
            if (!isActive) {
                // Check if user is pastor trying to access billing
                let isPastor = false
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    isPastor = profile?.role === 'PASTOR'
                }

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
