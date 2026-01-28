import { createServerClient } from '@supabase/ssr'

export function createStaticClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
                    // Static client, no-op
                },
            },
        }
    )
}
