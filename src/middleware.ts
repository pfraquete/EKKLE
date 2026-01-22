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

    // Define allowed domains (including localhost)
    const currentHost =
        process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
            ? hostname.replace(`.ekkle.com.br`, '') // Adjust for Vercel/Prod domain
            : hostname.replace(`.localhost:3000`, '')

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

        // Rewrite to /site/[domain]
        // We preserve the full path (e.g. /eventos)
        url.pathname = `/site/${subdomain}${url.pathname}`

        // We can also set a header for easier access
        const response = NextResponse.rewrite(url)

        // Copy cookies from sessionResponse if needed (Supabase auth)
        // The previous updateSession call might have refreshed tokens.
        // We should merge that.

        // Complex part: updateSession returns a response. Rewrite also returns a response.
        // We need to create a rewrite response that *also* has the session cookies.

        // Let's rely on updateSession logic for now, but strictly speaking checking auth 
        // on public site might not be required for GETs, but is for /membro.

        // Add custom header for getChurch
        response.headers.set('x-church-slug', subdomain)

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
