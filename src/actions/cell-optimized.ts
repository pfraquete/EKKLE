'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

export interface OptimizedCellData {
    cell: {
        id: string
        name: string
        address: string | null
        neighborhood: string | null
        dayOfWeek: number | null
        meetingTime: string | null
        leader: {
            id: string
            full_name: string
            photo_url: string | null
        } | null
    }
    members: {
        id: string
        fullName: string
        photoUrl: string | null
        birthDate: string | null
    }[]
    stats: {
        membersCount: number
        avgAttendance: number
    }
    recentMeetings: {
        id: string
        date: string
        presentCount: number
        hasReport: boolean
    }[]
    userRole: string
}

export interface CellPhoto {
    id: string
    photo_url: string
    storage_path: string
    description: string | null
    photo_date: string | null
    created_at: string
    uploader: { full_name: string } | null
    face_processed: boolean
    face_count: number
}

export interface CellPrayerRequest {
    id: string
    cell_id: string
    author_id: string
    church_id: string
    request: string
    is_anonymous: boolean
    status: 'active' | 'answered' | 'archived'
    testimony: string | null
    created_at: string
    updated_at: string
    author: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
    supporters_count: number
    user_is_supporting: boolean
}

/**
 * OPTIMIZED: Get all cell data in a single database call
 * Uses stored procedure to reduce ~10 queries to 1
 */
export async function getMemberCellDataOptimized(): Promise<OptimizedCellData | null> {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) return null

    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_member_cell_data', { p_user_id: profile.id })

    if (error) {
        console.error('[getMemberCellDataOptimized] Error:', error)
        // Fallback to regular query if stored procedure doesn't exist
        return null
    }

    if (!data) return null

    // The stored procedure returns JSON, parse it properly
    const result = data as OptimizedCellData
    return result
}

/**
 * OPTIMIZED: Get cell photos in a single call
 */
export async function getCellPhotosOptimized(cellId: string): Promise<{ data: CellPhoto[] | null; error: string | null }> {
    const profile = await getProfile()
    if (!profile) return { data: null, error: 'Não autenticado' }

    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_cell_photos_optimized', { 
            p_cell_id: cellId,
            p_church_id: profile.church_id
        })

    if (error) {
        console.error('[getCellPhotosOptimized] Error:', error)
        return { data: null, error: error.message }
    }

    return { data: data as CellPhoto[] || [], error: null }
}

/**
 * OPTIMIZED: Get prayer requests in a single call
 */
export async function getCellPrayerRequestsOptimized(cellId: string): Promise<{ data: CellPrayerRequest[] | null; error: string | null }> {
    const profile = await getProfile()
    if (!profile) return { data: null, error: 'Não autenticado' }

    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_cell_prayer_requests_optimized', { 
            p_cell_id: cellId,
            p_church_id: profile.church_id,
            p_user_id: profile.id
        })

    if (error) {
        console.error('[getCellPrayerRequestsOptimized] Error:', error)
        return { data: null, error: error.message }
    }

    return { data: data as CellPrayerRequest[] || [], error: null }
}
