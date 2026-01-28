import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { extractSubdomain, resolveChurchFromSubdomain, isPublicWebsiteRoute, isAdminRoute } from '@/lib/tenant'

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2]

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
    const authRoutes = ['/login', '/forgot-password', '/reset-password', '/register', '/registro']
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )
    const isApiRoute = pathname.startsWith('/api')

    // =====================================================
    // SUBSCRIPTION CHECK - Block access if subscription expired
    // =====================================================
    if (church && !isApiRoute && !isAuthRoute) {
        // Check if church has active subscription
        const { data: hasSubscription } = await supabase
            .rpc('has_active_subscription', { p_church_id: church.id })
            .single()

        const subscriptionActive = hasSubscription as boolean

        // Routes that are always accessible (even without subscription)
        const subscriptionExemptRoutes = [
            '/assinatura-expirada',
            '/logout',
        ]

        const isSubscriptionExempt = subscriptionExemptRoutes.some(route =>
            pathname.startsWith(route)
        )

        // If no active subscription and not exempt route
        if (!subscriptionActive && !isSubscriptionExempt) {
            // Get user profile to check if pastor
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
                const redirectResponse = NextResponse.redirect(url)

                // Copy cookies
                const allCookies = supabaseResponse.cookies.getAll()
                allCookies.forEach(cookie => {
                    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
                })

                return redirectResponse
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
