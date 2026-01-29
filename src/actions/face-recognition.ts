'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'

// Types
export interface FaceDetectionData {
    embedding: number[]
    box: {
        x: number
        y: number
        width: number
        height: number
    }
    profileId?: string
    confidence?: number
}

export interface PhotoFaceResult {
    detectionId: string
    profileId: string | null
    fullName: string | null
    memberPhotoUrl: string | null
    confidence: number | null
    boxX: number
    boxY: number
    boxWidth: number
    boxHeight: number
}

export interface MemberPhotoResult {
    photoId: string
    photoUrl: string
    confidence: number
    boxX: number
    boxY: number
    boxWidth: number
    boxHeight: number
    photoCreatedAt: string
}

/**
 * Save or update face embedding for a member (from profile photo)
 */
export async function saveMemberEmbedding(embedding: number[]) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Format embedding for pgvector
    const embeddingStr = `[${embedding.join(',')}]`

    // Upsert embedding
    const { error } = await supabase
        .from('member_face_embeddings')
        .upsert({
            profile_id: profile.id,
            church_id: profile.church_id,
            embedding: embeddingStr,
        }, {
            onConflict: 'profile_id',
        })

    if (error) {
        console.error('[saveMemberEmbedding] Error:', error)
        return { success: false, error: 'Erro ao salvar embedding facial' }
    }

    return { success: true }
}

/**
 * Get face embedding for a member
 */
export async function getMemberEmbedding(profileId: string) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('member_face_embeddings')
        .select('embedding')
        .eq('profile_id', profileId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // Not found
            return { success: true, data: null }
        }
        console.error('[getMemberEmbedding] Error:', error)
        return { success: false, error: 'Erro ao buscar embedding', data: null }
    }

    return { success: true, data: data.embedding }
}

/**
 * Get all face embeddings for a church (for matching)
 */
export async function getChurchEmbeddings() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('member_face_embeddings')
        .select(`
            profile_id,
            embedding,
            profiles!inner (
                full_name,
                photo_url
            )
        `)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('[getChurchEmbeddings] Error:', error)
        return { success: false, error: 'Erro ao buscar embeddings', data: [] }
    }

    const embeddings = data.map((item: any) => ({
        profileId: item.profile_id,
        embedding: item.embedding,
        fullName: item.profiles?.full_name || 'Membro',
        photoUrl: item.profiles?.photo_url || null,
    }))

    return { success: true, data: embeddings }
}

/**
 * Save face detections for a photo
 */
export async function savePhotoDetections(
    photoId: string,
    detections: FaceDetectionData[]
) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Only leaders and pastors can save detections
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        return { success: false, error: 'Sem permissão' }
    }

    const supabase = await createClient()

    // First, delete existing detections for this photo
    await supabase
        .from('photo_face_detections')
        .delete()
        .eq('photo_id', photoId)

    if (detections.length === 0) {
        // Mark photo as processed with 0 faces
        await supabase
            .from('cell_photos')
            .update({
                face_processed: true,
                face_count: 0,
            })
            .eq('id', photoId)

        return { success: true }
    }

    // Insert new detections
    const insertData = detections.map(detection => ({
        photo_id: photoId,
        church_id: profile.church_id,
        profile_id: detection.profileId || null,
        embedding: `[${detection.embedding.join(',')}]`,
        confidence: detection.confidence || null,
        box_x: detection.box.x,
        box_y: detection.box.y,
        box_width: detection.box.width,
        box_height: detection.box.height,
    }))

    const { error: insertError } = await supabase
        .from('photo_face_detections')
        .insert(insertData)

    if (insertError) {
        console.error('[savePhotoDetections] Error:', insertError)
        return { success: false, error: 'Erro ao salvar detecções' }
    }

    // Mark photo as processed
    await supabase
        .from('cell_photos')
        .update({
            face_processed: true,
            face_count: detections.length,
        })
        .eq('id', photoId)

    return { success: true }
}

/**
 * Get face detections for a photo
 */
export async function getPhotoDetections(photoId: string): Promise<{
    success: boolean
    error?: string
    data?: PhotoFaceResult[]
}> {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_photo_faces', {
            p_photo_id: photoId,
        })

    if (error) {
        console.error('[getPhotoDetections] Error:', error)
        return { success: false, error: 'Erro ao buscar faces' }
    }

    const results: PhotoFaceResult[] = data.map((item: any) => ({
        detectionId: item.detection_id,
        profileId: item.profile_id,
        fullName: item.full_name,
        memberPhotoUrl: item.member_photo_url,
        confidence: item.confidence,
        boxX: item.box_x,
        boxY: item.box_y,
        boxWidth: item.box_width,
        boxHeight: item.box_height,
    }))

    return { success: true, data: results }
}

/**
 * Match a face embedding to a member using database function
 */
export async function matchFaceToMember(embedding: number[]) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: null }
    }

    const supabase = await createClient()

    const embeddingStr = `[${embedding.join(',')}]`

    const { data, error } = await supabase
        .rpc('match_face_embedding', {
            query_embedding: embeddingStr,
            match_threshold: 0.6,
            p_church_id: profile.church_id,
        })

    if (error) {
        console.error('[matchFaceToMember] Error:', error)
        return { success: false, error: 'Erro ao buscar match', data: null }
    }

    if (!data || data.length === 0) {
        return { success: true, data: null }
    }

    return {
        success: true,
        data: {
            profileId: data[0].profile_id,
            fullName: data[0].full_name,
            photoUrl: data[0].photo_url,
            similarity: data[0].similarity,
        },
    }
}

/**
 * Search photos where a specific member appears
 */
export async function searchPhotosByMember(
    memberId: string,
    limit: number = 50
): Promise<{
    success: boolean
    error?: string
    data?: MemberPhotoResult[]
}> {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('search_photos_by_member', {
            p_profile_id: memberId,
            p_church_id: profile.church_id,
            p_limit: limit,
        })

    if (error) {
        console.error('[searchPhotosByMember] Error:', error)
        return { success: false, error: 'Erro ao buscar fotos' }
    }

    const results: MemberPhotoResult[] = data.map((item: any) => ({
        photoId: item.photo_id,
        photoUrl: item.photo_url,
        confidence: item.confidence,
        boxX: item.box_x,
        boxY: item.box_y,
        boxWidth: item.box_width,
        boxHeight: item.box_height,
        photoCreatedAt: item.photo_created_at,
    }))

    return { success: true, data: results }
}

/**
 * Get unprocessed photos for a cell
 */
export async function getUnprocessedPhotos(cellId: string, limit: number = 10) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_photos')
        .select('id, photo_url')
        .eq('cell_id', cellId)
        .eq('face_processed', false)
        .limit(limit)

    if (error) {
        console.error('[getUnprocessedPhotos] Error:', error)
        return { success: false, error: 'Erro ao buscar fotos', data: [] }
    }

    return { success: true, data: data || [] }
}

/**
 * Get members with face embeddings for a cell (for display purposes)
 */
export async function getMembersWithEmbeddings() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('member_face_embeddings')
        .select(`
            profile_id,
            profiles!inner (
                id,
                full_name,
                photo_url
            )
        `)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('[getMembersWithEmbeddings] Error:', error)
        return { success: false, error: 'Erro ao buscar membros', data: [] }
    }

    const members = data.map((item: any) => ({
        id: item.profiles.id,
        fullName: item.profiles.full_name,
        photoUrl: item.profiles.photo_url,
    }))

    return { success: true, data: members }
}
