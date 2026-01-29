'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Get user's current consent status
 */
export async function getConsentStatus() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('[getConsentStatus] Error:', error)
        return { success: false, error: 'Erro ao buscar consentimentos', data: null }
    }

    return {
        success: true,
        data: data || {
            face_recognition: false,
            marketing_emails: false,
            data_analytics: false,
        }
    }
}

/**
 * Update user consent for a specific feature
 */
export async function updateConsent(
    consentType: 'face_recognition' | 'marketing_emails' | 'data_analytics',
    granted: boolean
) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Upsert consent record
    const { error } = await supabase
        .from('user_consents')
        .upsert({
            profile_id: profile.id,
            [consentType]: granted,
            [`${consentType}_date`]: granted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'profile_id',
        })

    if (error) {
        console.error('[updateConsent] Error:', error)
        return { success: false, error: 'Erro ao atualizar consentimento' }
    }

    // If revoking face recognition consent, delete the embedding
    if (consentType === 'face_recognition' && !granted) {
        await supabase
            .from('member_face_embeddings')
            .delete()
            .eq('profile_id', profile.id)
    }

    revalidatePath('/configuracoes')
    return { success: true }
}

/**
 * Export all user data (LGPD right to data portability)
 */
export async function exportUserData() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: null }
    }

    const supabase = await createClient()

    // Gather all user data
    const [
        { data: profileData },
        { data: attendanceData },
        { data: tithesData },
        { data: cellMeetingsData },
        { data: courseEnrollmentsData },
        { data: eventRegistrationsData },
        { data: ordersData },
        { data: consentsData },
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profile.id).single(),
        supabase.from('attendance').select('*').eq('profile_id', profile.id),
        supabase.from('tithes').select('id, amount_cents, status, month, year, created_at').eq('profile_id', profile.id),
        supabase.from('cell_meeting_attendance').select('*').eq('profile_id', profile.id),
        supabase.from('course_enrollments').select('*').eq('profile_id', profile.id),
        supabase.from('event_registrations').select('*').eq('profile_id', profile.id),
        supabase.from('orders').select('id, total_cents, status, created_at').eq('profile_id', profile.id),
        supabase.from('user_consents').select('*').eq('profile_id', profile.id).single(),
    ])

    const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileData ? {
            id: profileData.id,
            full_name: profileData.full_name,
            email: profileData.email,
            phone: profileData.phone,
            role: profileData.role,
            created_at: profileData.created_at,
        } : null,
        attendance: attendanceData || [],
        tithes: tithesData || [],
        cellMeetings: cellMeetingsData || [],
        courseEnrollments: courseEnrollmentsData || [],
        eventRegistrations: eventRegistrationsData || [],
        orders: ordersData || [],
        consents: consentsData || null,
    }

    return { success: true, data: exportData }
}

/**
 * Request account deletion (LGPD right to erasure)
 */
export async function requestAccountDeletion(reason?: string) {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Create deletion request
    const { error } = await supabase
        .from('deletion_requests')
        .insert({
            profile_id: profile.id,
            church_id: profile.church_id,
            reason: reason || null,
            status: 'PENDING',
            requested_at: new Date().toISOString(),
        })

    if (error) {
        console.error('[requestAccountDeletion] Error:', error)
        return { success: false, error: 'Erro ao solicitar exclusão' }
    }

    // Notify church admin
    // TODO: Send email notification to church admin

    return { success: true }
}

/**
 * Delete all user biometric data
 */
export async function deleteBiometricData() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Delete face embedding
    const { error: embeddingError } = await supabase
        .from('member_face_embeddings')
        .delete()
        .eq('profile_id', profile.id)

    if (embeddingError) {
        console.error('[deleteBiometricData] Error deleting embedding:', embeddingError)
    }

    // Remove profile_id from photo detections (anonymize, don't delete detection)
    const { error: detectionError } = await supabase
        .from('photo_face_detections')
        .update({ profile_id: null, confidence: null })
        .eq('profile_id', profile.id)

    if (detectionError) {
        console.error('[deleteBiometricData] Error anonymizing detections:', detectionError)
    }

    // Update consent
    await supabase
        .from('user_consents')
        .upsert({
            profile_id: profile.id,
            face_recognition: false,
            face_recognition_date: null,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'profile_id',
        })

    revalidatePath('/configuracoes')
    return { success: true }
}

/**
 * Get deletion request status
 */
export async function getDeletionRequestStatus() {
    const profile = await getProfile()

    if (!profile) {
        return { success: false, error: 'Não autenticado', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('[getDeletionRequestStatus] Error:', error)
        return { success: false, error: 'Erro ao buscar status', data: null }
    }

    return { success: true, data }
}
