// RESCUE MODE - Simplified Middleware
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Just update session, no complex routing
    const response = await updateSession(request)

    console.log('[Middleware] Request:', {
        pathname: request.nextUrl.pathname,
        hostname: request.headers.get('host'),
    })

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
