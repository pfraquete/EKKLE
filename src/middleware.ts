import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    try {
        // Update session first (auth)
        const sessionResponse = await updateSession(request)

        const url = request.nextUrl
        const hostname = request.headers.get('host') || ''

        // Check if it's a tenant subdomain
        if (
            hostname !== 'localhost:3000' &&
            hostname !== 'ekkle.com.br' &&
            hostname !== 'www.ekkle.com.br' &&
            hostname !== 'app.ekkle.com.br'
        ) {
            // It's a tenant subdomain
            const subdomain = hostname.split('.')[0]

            // Routes that should NOT be rewritten to /site/[domain]
            // These are admin routes that exist in the (app) group
            const isBypassRoute =
                url.pathname.startsWith('/login') ||
                url.pathname.startsWith('/register') ||
                url.pathname.startsWith('/registro') ||
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
            // Note: /membro is NOT bypassed - it should rewrite to /site/[domain]/membro

            if (isBypassRoute) {
                // Check if sessionResponse is a redirect (e.g., subscription expired)
                if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
                    return sessionResponse
                }

                // Just inject headers for tenant context
                const requestHeaders = new Headers(request.headers)
                requestHeaders.set('x-church-slug', subdomain)
                requestHeaders.set('x-pathname', url.pathname)

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
            url.pathname = `/site/${subdomain}${url.pathname}`

            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-church-slug', subdomain)

            const response = NextResponse.rewrite(url, {
                request: {
                    headers: requestHeaders,
                },
            })

            // Apply cookies from sessionResponse
            sessionResponse.cookies.getAll().forEach((cookie) => {
                response.cookies.set(cookie.name, cookie.value, cookie)
            })

            return response
        }

        // Root domain - check if sessionResponse is a redirect first
        if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
            // sessionResponse is a redirect (e.g., subscription expired), return it as-is
            return sessionResponse
        }

        // Not a redirect - inject pathname header and return
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-pathname', url.pathname)

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
    } catch (error) {
        console.error('[Middleware] Error:', error)
        // On error, just pass through
        return NextResponse.next()
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
