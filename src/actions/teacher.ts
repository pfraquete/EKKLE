'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Get all teachers in the church (Pastor only)
 */
export async function getTeachers() {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, photo_url, is_teacher, role, created_at')
            .eq('church_id', profile.church_id)
            .eq('is_teacher', true)
            .order('full_name')

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching teachers:', error)
        return { success: false, error: 'Erro ao buscar professores' }
    }
}

/**
 * Get all members eligible to become teachers (Pastor only)
 */
export async function getEligibleMembers() {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, photo_url, is_teacher, role')
            .eq('church_id', profile.church_id)
            .neq('role', 'PASTOR') // Pastores não precisam ser marcados como professor
            .order('full_name')

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching eligible members:', error)
        return { success: false, error: 'Erro ao buscar membros' }
    }
}

/**
 * Set teacher status for a member (Pastor only)
 */
export async function setTeacherStatus(profileId: string, isTeacher: boolean) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const supabase = await createClient()

        // Verify the profile belongs to the same church
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('id, church_id')
            .eq('id', profileId)
            .eq('church_id', profile.church_id)
            .single()

        if (!targetProfile) {
            return { success: false, error: 'Membro não encontrado' }
        }

        const { error } = await supabase
            .from('profiles')
            .update({ is_teacher: isTeacher })
            .eq('id', profileId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath('/dashboard/professores')
        return { success: true }
    } catch (error) {
        console.error('Error setting teacher status:', error)
        return { success: false, error: 'Erro ao atualizar status de professor' }
    }
}

/**
 * Get courses assigned to a teacher
 */
export async function getTeacherCourses(teacherId?: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        // If no teacherId provided, use current user
        const targetTeacherId = teacherId || profile.id

        // Verify authorization: must be the teacher themselves, or a pastor
        if (targetTeacherId !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                teacher:profiles!teacher_id(full_name, photo_url),
                _count:course_enrollments(count)
            `)
            .eq('church_id', profile.church_id)
            .eq('teacher_id', targetTeacherId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching teacher courses:', error)
        return { success: false, error: 'Erro ao buscar cursos do professor' }
    }
}

/**
 * Check if current user is a teacher
 */
export async function isTeacher() {
    try {
        const profile = await getProfile()
        if (!profile) return false

        // Pastors have teacher privileges automatically
        if (profile.role === 'PASTOR') return true

        return profile.is_teacher === true
    } catch {
        return false
    }
}

/**
 * Get teacher dashboard stats
 */
export async function getTeacherDashboardStats() {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        // Must be a teacher or pastor
        if (!profile.is_teacher && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não é professor' }
        }

        const supabase = await createClient()

        // Get courses count
        const { count: coursesCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('teacher_id', profile.id)

        // Get total enrollments across all courses
        const { data: enrollmentsData } = await supabase
            .from('course_enrollments')
            .select('id, courses!inner(teacher_id)')
            .eq('courses.teacher_id', profile.id)

        // Get upcoming live lessons
        const { data: upcomingLessons } = await supabase
            .from('course_live_lessons')
            .select('*')
            .eq('teacher_id', profile.id)
            .in('status', ['SCHEDULED', 'LIVE'])
            .gte('scheduled_start', new Date().toISOString())
            .order('scheduled_start')
            .limit(5)

        // Get live lesson currently happening
        const { data: currentLesson } = await supabase
            .from('course_live_lessons')
            .select('*')
            .eq('teacher_id', profile.id)
            .eq('status', 'LIVE')
            .single()

        return {
            success: true,
            data: {
                coursesCount: coursesCount || 0,
                totalEnrollments: enrollmentsData?.length || 0,
                upcomingLessons: upcomingLessons || [],
                currentLesson: currentLesson || null,
            }
        }
    } catch (error) {
        console.error('Error fetching teacher stats:', error)
        return { success: false, error: 'Erro ao buscar estatísticas' }
    }
}

/**
 * Create a course as a teacher
 */
export async function teacherCreateCourse(data: {
    title: string
    description?: string
    thumbnail_url?: string
}) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        // Must be a teacher or pastor
        if (!profile.is_teacher && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não é professor' }
        }

        const supabase = await createClient()
        const { data: course, error } = await supabase
            .from('courses')
            .insert({
                church_id: profile.church_id,
                teacher_id: profile.id,
                created_by: profile.id,
                title: data.title,
                description: data.description || null,
                thumbnail_url: data.thumbnail_url || null,
                is_published: false,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/membro/professor/cursos')
        return { success: true, data: course }
    } catch (error) {
        console.error('Error creating course:', error)
        return { success: false, error: 'Erro ao criar curso' }
    }
}

/**
 * Update a course as a teacher
 */
export async function teacherUpdateCourse(courseId: string, data: {
    title?: string
    description?: string
    thumbnail_url?: string
    is_published?: boolean
}) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        // Verify ownership
        const { data: course } = await supabase
            .from('courses')
            .select('id, teacher_id')
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

        const { error } = await supabase
            .from('courses')
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq('id', courseId)

        if (error) throw error

        revalidatePath('/membro/professor/cursos')
        revalidatePath(`/membro/professor/cursos/${courseId}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating course:', error)
        return { success: false, error: 'Erro ao atualizar curso' }
    }
}

/**
 * Get course details for teacher
 */
export async function getTeacherCourseDetails(courseId: string) {
    try {
        const profile = await getProfile()
        if (!profile) {
            return { success: false, error: 'Não autenticado' }
        }

        const supabase = await createClient()

        const { data: course, error } = await supabase
            .from('courses')
            .select(`
                *,
                teacher:profiles!teacher_id(full_name, photo_url),
                videos:course_videos(id, title, duration_seconds, order_index, is_published),
                enrollments:course_enrollments(
                    id,
                    profile:profiles(id, full_name, photo_url),
                    progress_percentage,
                    enrolled_at
                ),
                live_lessons:course_live_lessons(
                    id,
                    title,
                    scheduled_start,
                    status
                )
            `)
            .eq('id', courseId)
            .eq('church_id', profile.church_id)
            .single()

        if (error) throw error

        if (!course) {
            return { success: false, error: 'Curso não encontrado' }
        }

        // Verify authorization
        if (course.teacher_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Não autorizado' }
        }

        return { success: true, data: course }
    } catch (error) {
        console.error('Error fetching course details:', error)
        return { success: false, error: 'Erro ao buscar detalhes do curso' }
    }
}
