import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Update session first (auth)
    const sessionResponse = await updateSession(request)
    // If session update redirects or handles response, return it, 
    // but updateSession usually just sets cookies/headers on the passed response 
    // or returns a new response.
    // Actually updateSession in Supabase SSR usually returns a response with cookies.
    // We need to adhere to that.

    // However, we need to rewrite the URL *before* or *after*?
    // Rewrites don't change the response object, they return a rewrite response.

    const url = request.nextUrl

    // Get hostname (e.g. 'verbo.ekkle.com.br' or 'localhost:3000')
    const hostname = request.headers.get('host') || ''

    // 1. App Subdomain (app.ekkle.com.br) -> Serve App (Dashboard)
    // Since we don't have a separate (app) folder, we assume /dashboard is in the root app.
    // If user accesses app.ekkle.com.br, they should see the landing page OR login?
    // Current app structure has (app), (landing), (site).
    // (app) folder usually contains dashboard.

    // 2. Church Subdomain (slug.ekkle.com.br)
    // If currentHost is NOT 'app' and NOT 'www' and NOT 'localhost:3000' (root)
    if (
        hostname !== 'localhost:3000' &&
        hostname !== 'ekkle.com.br' &&
        hostname !== 'www.ekkle.com.br' &&
        hostname !== 'app.ekkle.com.br'
    ) {
        // It's a tenant subdomain!
        const subdomain = hostname.split('.')[0]

        // Special handling for Auth and API Routes on Subdomain
        // We want to serve the (auth) pages and standard API routes without rewriting to /site/[domain]
        const isBypassRoute =
            url.pathname.startsWith('/login') ||
            url.pathname.startsWith('/register') ||
            url.pathname.startsWith('/cadastro') ||
            url.pathname.startsWith('/forgot-password') ||
            url.pathname.startsWith('/reset-password') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/dashboard') ||
            url.pathname.startsWith('/minha-celula') ||
            url.pathname.startsWith('/celulas') ||
            url.pathname.startsWith('/membros') ||
            url.pathname.startsWith('/financeiro') ||
            url.pathname.startsWith('/presenca-cultos') ||
            url.pathname.startsWith('/importar') ||
            url.pathname.startsWith('/calendario') ||
            url.pathname.startsWith('/configuracoes')

        if (isBypassRoute) {
            // Do NOT rewrite to /site/[domain]
            // Just let it pass but inject headers for tenant context
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-church-slug', subdomain)

            const response = NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            })

            // Apply session cookies
            sessionResponse.cookies.getAll().forEach((cookie) => {
                response.cookies.set(cookie.name, cookie.value, cookie)
            })

            return response
        }

        // Rewrite to /site/${subdomain}${url.pathname}
        // We preserve the full path (e.g. /eventos)
        url.pathname = `/site/${subdomain}${url.pathname}`

        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-church-slug', subdomain)

        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        })

        // Apply session cookies
        sessionResponse.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie)
        })

        return response
    }

    // 3. Root Domain -> Landing Page or App
    // Default behavior handles (landing) and (app) normally via file system

    return sessionResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
