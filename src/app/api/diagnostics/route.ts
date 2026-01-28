import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            env: {
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
                NODE_ENV: process.env.NODE_ENV,
            },
            status: 'OK'
        }

        return NextResponse.json(diagnostics, { status: 200 })
    } catch (error) {
        return NextResponse.json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
