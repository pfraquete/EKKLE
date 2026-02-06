'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import Mux from '@mux/mux-node'

// Types
export type LessonStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'

export type CourseLiveLesson = {
    id: string
    church_id: string
    course_id: string
    teacher_id: string
    title: string
    description: string | null
    scheduled_start: string
    scheduled_end: string | null
    actual_start: string | null
    actual_end: string | null
    status: LessonStatus
    mux_stream_key: string | null
    mux_playback_id: string | null
    mux_live_stream_id: string | null
    recording_url: string | null
    chat_enabled: boolean
    created_at: string
    updated_at: string
    course?: {
        id: string
        title: string
        thumbnail_url: string | null
    }
    teacher?: {
        id: string
        full_name: string
        photo_url: string | null
    }
}

export type LessonAttendance = {
    id: string
    lesson_id: string
    student_id: string
    joined_at: string
    left_at: string | null
    is_online: boolean
    watch_time_seconds: number
    is_present_valid: boolean
    student?: {
        id: string
        full_name: string
        photo_url: string | null
    }
}

// Initialize Mux client
function getMuxClient() {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
        return null
    }

    return new Mux({
        tokenId,
        tokenSecret,
    })
}

/**
 * Create a new live lesson for a course
 */
export async function createLiveLesson(courseId: string, input: {
    title: string
    description?: string
    scheduled_start: string
    scheduled_end?: string
    chat_enabled?: boolean
}) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Verify the course exists and belongs to this teacher
        const { data: course } = await supabase
            .from('courses')
            .select('id, teacher_id, church_id')
            .eq('id', courseId)
            .eq('church_id', profile.church_id)
            .single()

        if (!course) {
            return { success: false, error: 'Curso não encontrado' }
        }

        // Must be the course teacher or a pastor
        if (course.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        // Create Mux live stream
        let muxStreamKey: string | null = null
        let muxPlaybackId: string | null = null
        let muxLiveStreamId: string | null = null

        const mux = getMuxClient()
        if (mux) {
            try {
                const liveStream = await mux.video.liveStreams.create({
                    playback_policy: ['public'],
                    new_asset_settings: {
                        playback_policy: ['public'],
                    },
                    max_continuous_duration: 43200, // 12 hours max
                })

                muxStreamKey = liveStream.stream_key || null
                muxPlaybackId = liveStream.playback_ids?.[0]?.id || null
                muxLiveStreamId = liveStream.id
            } catch (muxError) {
                console.error('Error creating Mux stream:', muxError)
                // Continue without Mux - lesson can still be created
            }
        }

        const { data, error } = await supabase
            .from('course_live_lessons')
            .insert({
                church_id: profile.church_id,
                course_id: courseId,
                teacher_id: profile.id,
                title: input.title,
                description: input.description || null,
                scheduled_start: input.scheduled_start,
                scheduled_end: input.scheduled_end || null,
                chat_enabled: input.chat_enabled ?? true,
                mux_stream_key: muxStreamKey,
                mux_playback_id: muxPlaybackId,
                mux_live_stream_id: muxLiveStreamId,
                status: 'SCHEDULED',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating live lesson:', error)
            return { success: false, error: 'Erro ao criar aula ao vivo' }
        }

        revalidatePath(`/membro/professor/cursos/${courseId}`)
        revalidatePath('/membro/aulas-ao-vivo')
        revalidatePath('/dashboard/cursos')

        return { success: true, data }
    } catch (error) {
        console.error('Error creating live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Update a live lesson
 */
export async function updateLiveLesson(lessonId: string, input: {
    title?: string
    description?: string
    scheduled_start?: string
    scheduled_end?: string
    chat_enabled?: boolean
}) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Verify the lesson exists and belongs to this teacher
        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('id, teacher_id, course_id')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const { error } = await supabase
            .from('course_live_lessons')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', lessonId)

        if (error) {
            return { success: false, error: 'Erro ao atualizar aula' }
        }

        revalidatePath(`/membro/professor/cursos/${lesson.course_id}`)
        revalidatePath('/dashboard/cursos')
        return { success: true }
    } catch (error) {
        console.error('Error updating live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Start a live lesson
 */
export async function startLiveLesson(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('id, teacher_id, course_id, status')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        if (lesson.status === 'LIVE') {
            return { success: false, error: 'Aula já está ao vivo' }
        }

        if (lesson.status === 'ENDED') {
            return { success: false, error: 'Aula já foi encerrada' }
        }

        const { error } = await supabase
            .from('course_live_lessons')
            .update({
                status: 'LIVE',
                actual_start: new Date().toISOString(),
            })
            .eq('id', lessonId)

        if (error) {
            return { success: false, error: 'Erro ao iniciar aula' }
        }

        revalidatePath(`/membro/professor/cursos/${lesson.course_id}`)
        revalidatePath('/membro/aulas-ao-vivo')

        return { success: true }
    } catch (error) {
        console.error('Error starting live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * End a live lesson
 */
export async function endLiveLesson(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('*')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        // Complete Mux stream if exists
        if (lesson.mux_live_stream_id) {
            const mux = getMuxClient()
            if (mux) {
                try {
                    await mux.video.liveStreams.complete(lesson.mux_live_stream_id)
                } catch (muxError) {
                    console.error('Error completing Mux stream:', muxError)
                }
            }
        }

        const { error } = await supabase
            .from('course_live_lessons')
            .update({
                status: 'ENDED',
                actual_end: new Date().toISOString(),
            })
            .eq('id', lessonId)

        if (error) {
            return { success: false, error: 'Erro ao encerrar aula' }
        }

        // Calculate attendance for all students
        await supabase.rpc('calculate_lesson_attendance', { p_lesson_id: lessonId })

        revalidatePath(`/membro/professor/cursos/${lesson.course_id}`)
        revalidatePath('/membro/aulas-ao-vivo')

        return { success: true }
    } catch (error) {
        console.error('Error ending live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Cancel a scheduled lesson
 */
export async function cancelLiveLesson(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('id, teacher_id, course_id, status, mux_live_stream_id')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        if (lesson.status === 'LIVE') {
            return { success: false, error: 'Não é possível cancelar aula ao vivo. Encerre primeiro.' }
        }

        // Delete Mux stream if exists
        if (lesson.mux_live_stream_id) {
            const mux = getMuxClient()
            if (mux) {
                try {
                    await mux.video.liveStreams.delete(lesson.mux_live_stream_id)
                } catch (muxError) {
                    console.error('Error deleting Mux stream:', muxError)
                }
            }
        }

        const { error } = await supabase
            .from('course_live_lessons')
            .update({ status: 'CANCELLED' })
            .eq('id', lessonId)

        if (error) {
            return { success: false, error: 'Erro ao cancelar aula' }
        }

        revalidatePath(`/membro/professor/cursos/${lesson.course_id}`)
        revalidatePath('/dashboard/cursos')
        return { success: true }
    } catch (error) {
        console.error('Error cancelling live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Get live lessons for a course
 */
export async function getCourseLiveLessons(courseId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado', data: [] }
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_live_lessons')
            .select(`
                *,
                teacher:profiles!teacher_id(id, full_name, photo_url)
            `)
            .eq('course_id', courseId)
            .eq('church_id', profile.church_id)
            .order('scheduled_start', { ascending: false })

        if (error) {
            console.error('Error fetching live lessons:', error)
            return { success: false, error: 'Erro ao buscar aulas', data: [] }
        }

        return { success: true, data: data as CourseLiveLesson[] }
    } catch (error) {
        console.error('Error fetching live lessons:', error)
        return { success: false, error: 'Erro desconhecido', data: [] }
    }
}

/**
 * Get a specific live lesson
 */
export async function getLiveLesson(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_live_lessons')
            .select(`
                *,
                course:courses(id, title, thumbnail_url),
                teacher:profiles!teacher_id(id, full_name, photo_url)
            `)
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (error) {
            return { success: false, error: 'Aula não encontrada' }
        }

        return { success: true, data: data as CourseLiveLesson }
    } catch (error) {
        console.error('Error fetching live lesson:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Get all available live lessons for a student
 */
export async function getAvailableLiveLessons() {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado', data: [] }
        }

        const supabase = await createClient()

        // Get lessons from courses the student is enrolled in
        const { data, error } = await supabase
            .from('course_live_lessons')
            .select(`
                *,
                course:courses(id, title, thumbnail_url),
                teacher:profiles!teacher_id(id, full_name, photo_url)
            `)
            .eq('church_id', profile.church_id)
            .in('status', ['SCHEDULED', 'LIVE'])
            .gte('scheduled_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h and future
            .order('scheduled_start', { ascending: true })

        if (error) {
            console.error('Error fetching available lessons:', error)
            return { success: false, error: 'Erro ao buscar aulas', data: [] }
        }

        // Filter to only show lessons from enrolled courses (or if user is teacher)
        const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('course_id')
            .eq('profile_id', profile.id)

        const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])

        const filteredLessons = data?.filter(lesson =>
            enrolledCourseIds.has(lesson.course_id) ||
            lesson.teacher_id === profile.id ||
            profile.role === 'PASTOR'
        ) || []

        return { success: true, data: filteredLessons as CourseLiveLesson[] }
    } catch (error) {
        console.error('Error fetching available lessons:', error)
        return { success: false, error: 'Erro desconhecido', data: [] }
    }
}

/**
 * Get attendance for a lesson
 */
export async function getLessonAttendance(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado', data: [] }
        }

        const supabase = await createClient()

        // Verify permission (teacher or pastor)
        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('teacher_id')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada', data: [] }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado', data: [] }
        }

        const { data, error } = await supabase
            .from('course_live_attendance')
            .select(`
                *,
                student:profiles!student_id(id, full_name, photo_url)
            `)
            .eq('lesson_id', lessonId)
            .order('joined_at', { ascending: true })

        if (error) {
            console.error('Error fetching attendance:', error)
            return { success: false, error: 'Erro ao buscar presença', data: [] }
        }

        return { success: true, data: data as LessonAttendance[] }
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return { success: false, error: 'Erro desconhecido', data: [] }
    }
}

/**
 * Join a live lesson (student)
 */
export async function joinLiveLesson(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Update attendance using RPC
        await supabase.rpc('update_lesson_attendance', {
            p_lesson_id: lessonId,
            p_is_online: true,
            p_additional_seconds: 0,
        })

        return { success: true }
    } catch (error) {
        console.error('Error joining live lesson:', error)
        return { success: false, error: 'Erro ao entrar na aula' }
    }
}

/**
 * Leave a live lesson (student)
 */
export async function leaveLiveLesson(lessonId: string, watchedSeconds: number = 0) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: true } // Don't fail on leave
        }

        const supabase = await createClient()

        await supabase.rpc('update_lesson_attendance', {
            p_lesson_id: lessonId,
            p_is_online: false,
            p_additional_seconds: watchedSeconds,
        })

        return { success: true }
    } catch (error) {
        console.error('Error leaving live lesson:', error)
        return { success: true } // Don't fail on leave
    }
}

/**
 * Update watch time (called periodically while watching)
 */
export async function updateWatchTime(lessonId: string, additionalSeconds: number) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false }
        }

        const supabase = await createClient()

        await supabase.rpc('update_lesson_attendance', {
            p_lesson_id: lessonId,
            p_is_online: true,
            p_additional_seconds: additionalSeconds,
        })

        return { success: true }
    } catch (error) {
        console.error('Error updating watch time:', error)
        return { success: false }
    }
}

/**
 * Get online count for a lesson
 */
export async function getLessonOnlineCount(lessonId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .rpc('get_lesson_online_count', { p_lesson_id: lessonId })

        if (error) {
            return 0
        }

        return data as number
    } catch (error) {
        console.error('Error getting online count:', error)
        return 0
    }
}

/**
 * Toggle chat for a lesson
 */
export async function toggleLessonChat(lessonId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('teacher_id, chat_enabled')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (lesson.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const { error } = await supabase
            .from('course_live_lessons')
            .update({ chat_enabled: !lesson.chat_enabled })
            .eq('id', lessonId)

        if (error) {
            return { success: false, error: 'Erro ao alterar chat' }
        }

        return { success: true, chatEnabled: !lesson.chat_enabled }
    } catch (error) {
        console.error('Error toggling lesson chat:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

// =====================================================
// CHAT FUNCTIONS
// =====================================================

/**
 * Send a chat message in a live lesson
 */
export async function sendLessonChatMessage(lessonId: string, message: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        if (!message.trim()) {
            return { success: false, error: 'Mensagem não pode ser vazia' }
        }

        if (message.length > 500) {
            return { success: false, error: 'Mensagem muito longa (máximo 500 caracteres)' }
        }

        const supabase = await createClient()

        // Check if chat is enabled
        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('chat_enabled, status')
            .eq('id', lessonId)
            .eq('church_id', profile.church_id)
            .single()

        if (!lesson) {
            return { success: false, error: 'Aula não encontrada' }
        }

        if (!lesson.chat_enabled) {
            return { success: false, error: 'Chat desabilitado para esta aula' }
        }

        if (lesson.status !== 'LIVE') {
            return { success: false, error: 'Chat disponível apenas durante aulas ao vivo' }
        }

        const { data, error } = await supabase
            .from('course_live_chat')
            .insert({
                lesson_id: lessonId,
                church_id: profile.church_id,
                profile_id: profile.id,
                message: message.trim(),
            })
            .select(`
                *,
                profile:profiles(id, full_name, photo_url, role)
            `)
            .single()

        if (error) {
            return { success: false, error: 'Erro ao enviar mensagem' }
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error sending chat message:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}

/**
 * Get chat messages for a lesson
 */
export async function getLessonChatMessages(lessonId: string, limit = 100) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return []
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_live_chat')
            .select(`
                *,
                profile:profiles(id, full_name, photo_url, role)
            `)
            .eq('lesson_id', lessonId)
            .eq('church_id', profile.church_id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(limit)

        if (error) {
            console.error('Error getting chat messages:', error)
            return []
        }

        return data
    } catch (error) {
        console.error('Error getting chat messages:', error)
        return []
    }
}

/**
 * Delete a chat message
 */
export async function deleteLessonChatMessage(messageId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: message } = await supabase
            .from('course_live_chat')
            .select('profile_id, lesson_id')
            .eq('id', messageId)
            .eq('church_id', profile.church_id)
            .single()

        if (!message) {
            return { success: false, error: 'Mensagem não encontrada' }
        }

        // Check if user can delete (own message, teacher, or pastor)
        const { data: lesson } = await supabase
            .from('course_live_lessons')
            .select('teacher_id')
            .eq('id', message.lesson_id)
            .single()

        const canDelete =
            message.profile_id === profile.id ||
            lesson?.teacher_id === profile.id ||
            profile.role === 'PASTOR'

        if (!canDelete) {
            return { success: false, error: 'Sem permissão para excluir esta mensagem' }
        }

        const { error } = await supabase
            .from('course_live_chat')
            .update({
                is_deleted: true,
                deleted_by: profile.id,
            })
            .eq('id', messageId)

        if (error) {
            return { success: false, error: 'Erro ao excluir mensagem' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error deleting chat message:', error)
        return { success: false, error: 'Erro desconhecido' }
    }
}
