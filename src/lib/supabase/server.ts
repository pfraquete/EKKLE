import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import '../env' // Validate environment variables

type CookieStore = Awaited<ReturnType<typeof cookies>>
type CookieOptions = Parameters<CookieStore['set']>[2]

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component - ignore
                    }
                },
            },
        }
    )
}

export function createStaticClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    // Static client, no-op
                },
            },
        }
    )
}
