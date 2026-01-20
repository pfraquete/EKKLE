import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

    console.log('[Middleware] Path:', request.nextUrl.pathname)
    console.log('[Middleware] Auth Status:', user ? 'Logged In' : 'Logged Out')
    console.log('[Middleware] Cookies Present:', request.cookies.getAll().map(c => c.name).join(', '))

    // Rotas públicas
    const publicRoutes = ['/login', '/forgot-password', '/reset-password']
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    // Não logado tentando acessar área protegida
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)

        // Copy cookies from supabaseResponse (which might have refreshed session)
        const allCookies = supabaseResponse.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    // Logado tentando acessar login
    // if (user && isPublicRoute) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/dashboard'
    //     const redirectResponse = NextResponse.redirect(url)
    //
    //     // Copy cookies from supabaseResponse
    //     const allCookies = supabaseResponse.cookies.getAll()
    //     allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))
    //
    //     return redirectResponse
    // }

    return supabaseResponse
}
