'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export interface CourseComment {
    id: string
    church_id: string
    video_id: string
    profile_id: string
    content: string
    parent_id: string | null
    is_pinned: boolean
    is_answered: boolean
    created_at: string
    profiles: {
        full_name: string
        photo_url: string | null
        role: string
    }
}

/**
 * Get all comments for a specific video
 */
export async function getLessonComments(videoId: string): Promise<CourseComment[]> {
    try {
        const supabase = await createClient()
        const profile = await getProfile()
        if (!profile) return []

        const { data: comments, error } = await supabase
            .from('course_lesson_comments')
            .select('*, profiles(full_name, photo_url, role)')
            .eq('video_id', videoId)
            .eq('church_id', profile.church_id)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
            return []
        }

        return comments as unknown as CourseComment[]
    } catch (error) {
        console.error('Unexpected error fetching comments:', error)
        return []
    }
}

/**
 * Post a new comment
 */
export async function postComment(videoId: string, content: string, parentId?: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        if (!content.trim()) return { success: false, error: 'O conteúdo não pode ser vazio' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('course_lesson_comments')
            .insert({
                video_id: videoId,
                church_id: profile.church_id,
                profile_id: profile.id,
                content: content.trim(),
                parent_id: parentId || null
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/membro/cursos`, 'layout')
        return { success: true, data }
    } catch (error) {
        console.error('Error posting comment:', error)
        return { success: false, error: 'Falha ao enviar comentário' }
    }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // First verify the comment belongs to user's church and user is author or pastor
        const { data: comment } = await supabase
            .from('course_lesson_comments')
            .select('id, profile_id, church_id')
            .eq('id', commentId)
            .eq('church_id', profile.church_id)
            .single()

        if (!comment) {
            return { success: false, error: 'Comentário não encontrado' }
        }

        // Check permission: user must be the author or a pastor
        const isAuthor = comment.profile_id === profile.id
        const isPastor = profile.role === 'PASTOR'

        if (!isAuthor && !isPastor) {
            return { success: false, error: 'Sem permissão para excluir este comentário' }
        }

        const { error } = await supabase
            .from('course_lesson_comments')
            .delete()
            .eq('id', commentId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath(`/membro/cursos`, 'layout')
        return { success: true }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return { success: false, error: 'Erro ao excluir comentário' }
    }
}

/**
 * Toggle Pinned status (Pastors only)
 */
export async function togglePinComment(commentId: string, isPinned: boolean) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') return { success: false, error: 'Sem permissão' }

        const supabase = await createClient()

        // Ensure comment belongs to pastor's church
        const { error } = await supabase
            .from('course_lesson_comments')
            .update({ is_pinned: isPinned })
            .eq('id', commentId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath(`/membro/cursos`, 'layout')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erro ao fixar comentário' }
    }
}

/**
 * Toggle Answered status (Pastors only)
 */
export async function toggleAnsweredComment(commentId: string, isAnswered: boolean) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') return { success: false, error: 'Sem permissão' }

        const supabase = await createClient()

        // Ensure comment belongs to pastor's church
        const { error } = await supabase
            .from('course_lesson_comments')
            .update({ is_answered: isAnswered })
            .eq('id', commentId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath(`/membro/cursos`, 'layout')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erro ao marcar como respondido' }
    }
}
