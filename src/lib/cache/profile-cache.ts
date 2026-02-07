import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

import type { Profile, ChurchModules } from '@/actions/auth'

/**
 * React.cache() deduplicates this function per-request in RSC.
 * Instead of calling getProfile() 7+ times per page load (each making 2 Supabase queries),
 * this ensures auth.getUser() + profiles.select() runs only ONCE per request.
 */
export const getCachedProfile = cache(async (): Promise<Profile | null> => {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return profile
})

/**
 * Cached version of getProfileWithModules - also deduped per request.
 */
export const getCachedProfileWithModules = cache(async (): Promise<Profile | null> => {
    const profile = await getCachedProfile()
    if (!profile) return null

    const supabase = await createClient()

    const { data: modules } = await supabase
        .from('church_modules')
        .select('cells_enabled, departments_enabled, ebd_enabled')
        .eq('church_id', profile.church_id)
        .single()

    return {
        ...profile,
        modules: modules ?? {
            cells_enabled: true,
            departments_enabled: false,
            ebd_enabled: false,
        }
    } as Profile
})
