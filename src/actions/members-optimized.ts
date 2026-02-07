'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

/**
 * OPTIMIZED: Get church members with only the fields needed for the list view.
 * Before: SELECT * (all columns including large text fields)
 * After: SELECT only id, full_name, photo_url, member_stage, phone, email + cell name
 */
export async function getChurchMembersOptimized() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            photo_url,
            member_stage,
            phone,
            email,
            cell:cells!profiles_cell_id_fkey(name)
        `)
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('full_name')

    if (error) {
        console.error('Error fetching members:', error)
        return []
    }
    return data
}
