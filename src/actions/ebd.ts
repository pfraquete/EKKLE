'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export interface EbdClass {
    id: string
    church_id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    is_published: boolean
    teacher_id: string | null
    course_type: 'EBD_CLASSE'
    created_at: string
    teacher?: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
    students_count?: number
    lessons_count?: number
}

export interface EbdLesson {
    id: string
    course_id: string
    church_id: string
    title: string
    description: string | null
    lesson_date: string
    lesson_order: number
    material_url: string | null
    created_at: string
    attendance_count?: number
    present_count?: number
}

export interface EbdAttendanceRecord {
    profile_id: string
    present: boolean
    notes: string | null
    profile?: {
        id: string
        full_name: string
        photo_url: string | null
    }
}

// ==================== CLASSES ====================

export async function getEbdClasses(): Promise<EbdClass[]> {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    const { data: classes, error } = await supabase
        .from('courses')
        .select(`
            id, church_id, title, description, thumbnail_url, is_published, teacher_id, course_type, created_at,
            teacher:profiles!courses_teacher_id_fkey(id, full_name, photo_url),
            course_enrollments(count)
        `)
        .eq('church_id', profile.church_id)
        .eq('course_type', 'EBD_CLASSE')
        .order('title')

    if (error) {
        console.error('Error fetching EBD classes:', error)
        return []
    }

    // Get lesson counts
    const classIds = classes.map(c => c.id)
    let lessonCounts: Record<string, number> = {}

    if (classIds.length > 0) {
        const { data: lessons } = await supabase
            .from('ebd_lessons')
            .select('course_id')
            .in('course_id', classIds)

        lessons?.forEach(l => {
            lessonCounts[l.course_id] = (lessonCounts[l.course_id] || 0) + 1
        })
    }

    return classes.map(c => {
        const teacherData = Array.isArray(c.teacher) ? c.teacher[0] : c.teacher
        return {
            ...c,
            teacher: teacherData || null,
            course_type: 'EBD_CLASSE' as const,
            students_count: (c.course_enrollments as unknown as { count: number }[])?.[0]?.count || 0,
            lessons_count: lessonCounts[c.id] || 0,
        } as EbdClass
    })
}

export async function getEbdClassById(id: string): Promise<{
    ebdClass: EbdClass
    students: { id: string; full_name: string; photo_url: string | null; email: string | null }[]
    lessons: EbdLesson[]
} | null> {
    const profile = await getProfile()
    if (!profile) return null

    const supabase = await createClient()

    const { data: ebdClass, error } = await supabase
        .from('courses')
        .select(`
            id, church_id, title, description, thumbnail_url, is_published, teacher_id, course_type, created_at,
            teacher:profiles!courses_teacher_id_fkey(id, full_name, photo_url)
        `)
        .eq('id', id)
        .eq('church_id', profile.church_id)
        .eq('course_type', 'EBD_CLASSE')
        .single()

    if (error || !ebdClass) {
        console.error('Error fetching EBD class:', error)
        return null
    }

    // Normalize teacher from array to single object
    const teacherData = Array.isArray(ebdClass.teacher) ? ebdClass.teacher[0] : ebdClass.teacher

    // Get enrolled students
    const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('profile:profiles(id, full_name, photo_url, email)')
        .eq('course_id', id)

    const students = (enrollments || [])
        .map(e => Array.isArray(e.profile) ? e.profile[0] : e.profile)
        .filter(Boolean) as { id: string; full_name: string; photo_url: string | null; email: string | null }[]

    // Get lessons
    const { data: lessons } = await supabase
        .from('ebd_lessons')
        .select('*')
        .eq('course_id', id)
        .order('lesson_date', { ascending: false })

    return {
        ebdClass: {
            ...ebdClass,
            teacher: teacherData || null,
            course_type: 'EBD_CLASSE' as const,
            students_count: students.length,
            lessons_count: lessons?.length || 0,
        } as EbdClass,
        students,
        lessons: lessons || [],
    }
}

export async function createEbdClass(data: { title: string; description?: string; teacher_id?: string }) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    if (!data.title?.trim()) {
        return { success: false, error: 'Nome da classe é obrigatório' }
    }

    const supabase = await createClient()

    const { data: ebdClass, error } = await supabase
        .from('courses')
        .insert({
            church_id: profile.church_id,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            teacher_id: data.teacher_id || null,
            course_type: 'EBD_CLASSE',
            is_published: true,
            created_by: profile.id,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating EBD class:', error)
        return { success: false, error: 'Erro ao criar classe' }
    }

    revalidatePath('/ebd')
    return { success: true, id: ebdClass.id }
}

export async function updateEbdClass(id: string, data: { title: string; description?: string; teacher_id?: string; is_published?: boolean }) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('courses')
        .update({
            title: data.title.trim(),
            description: data.description?.trim() || null,
            teacher_id: data.teacher_id || null,
            is_published: data.is_published ?? true,
        })
        .eq('id', id)
        .eq('church_id', profile.church_id)
        .eq('course_type', 'EBD_CLASSE')

    if (error) {
        console.error('Error updating EBD class:', error)
        return { success: false, error: 'Erro ao atualizar classe' }
    }

    revalidatePath('/ebd')
    revalidatePath(`/ebd/${id}`)
    return { success: true }
}

export async function deleteEbdClass(id: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('church_id', profile.church_id)
        .eq('course_type', 'EBD_CLASSE')

    if (error) {
        console.error('Error deleting EBD class:', error)
        return { success: false, error: 'Erro ao excluir classe' }
    }

    revalidatePath('/ebd')
    return { success: true }
}

// ==================== STUDENTS ====================

export async function enrollStudentInClass(courseId: string, profileId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('course_enrollments')
        .insert({
            course_id: courseId,
            profile_id: profileId,
        })

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Aluno já está matriculado nesta classe' }
        }
        console.error('Error enrolling student:', error)
        return { success: false, error: 'Erro ao matricular aluno' }
    }

    revalidatePath(`/ebd/${courseId}`)
    return { success: true }
}

export async function removeStudentFromClass(courseId: string, profileId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId)
        .eq('profile_id', profileId)

    if (error) {
        console.error('Error removing student:', error)
        return { success: false, error: 'Erro ao remover aluno' }
    }

    revalidatePath(`/ebd/${courseId}`)
    return { success: true }
}

// ==================== LESSONS ====================

export async function getEbdLessons(courseId: string): Promise<EbdLesson[]> {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('ebd_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('church_id', profile.church_id)
        .order('lesson_date', { ascending: false })

    if (error) {
        console.error('Error fetching EBD lessons:', error)
        return []
    }

    return data || []
}

export async function createEbdLesson(data: { course_id: string; title: string; description?: string; lesson_date: string; material_url?: string }) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    if (!data.title?.trim() || !data.lesson_date) {
        return { success: false, error: 'Título e data são obrigatórios' }
    }

    const supabase = await createClient()

    const { data: lesson, error } = await supabase
        .from('ebd_lessons')
        .insert({
            course_id: data.course_id,
            church_id: profile.church_id,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            lesson_date: data.lesson_date,
            material_url: data.material_url?.trim() || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating EBD lesson:', error)
        return { success: false, error: 'Erro ao criar lição' }
    }

    revalidatePath(`/ebd/${data.course_id}`)
    return { success: true, id: lesson.id }
}

export async function updateEbdLesson(id: string, data: { title: string; description?: string; lesson_date: string; material_url?: string }) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('ebd_lessons')
        .update({
            title: data.title.trim(),
            description: data.description?.trim() || null,
            lesson_date: data.lesson_date,
            material_url: data.material_url?.trim() || null,
        })
        .eq('id', id)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error updating EBD lesson:', error)
        return { success: false, error: 'Erro ao atualizar lição' }
    }

    revalidatePath(`/ebd`)
    return { success: true }
}

export async function deleteEbdLesson(id: string, courseId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('ebd_lessons')
        .delete()
        .eq('id', id)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error deleting EBD lesson:', error)
        return { success: false, error: 'Erro ao excluir lição' }
    }

    revalidatePath(`/ebd/${courseId}`)
    return { success: true }
}

// ==================== ATTENDANCE ====================

export async function getEbdAttendance(lessonId: string): Promise<EbdAttendanceRecord[]> {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('ebd_attendance')
        .select(`
            profile_id, present, notes,
            profile:profiles(id, full_name, photo_url)
        `)
        .eq('lesson_id', lessonId)

    if (error) {
        console.error('Error fetching EBD attendance:', error)
        return []
    }

    return (data || []).map(d => ({
        ...d,
        profile: Array.isArray(d.profile) ? d.profile[0] : d.profile,
    })) as EbdAttendanceRecord[]
}

export async function recordEbdAttendance(lessonId: string, records: { profileId: string; present: boolean }[]) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && !profile.is_teacher) throw new Error('Sem permissão')

    const supabase = await createClient()

    // Upsert all attendance records
    const { error } = await supabase
        .from('ebd_attendance')
        .upsert(
            records.map(r => ({
                lesson_id: lessonId,
                profile_id: r.profileId,
                present: r.present,
            })),
            { onConflict: 'lesson_id,profile_id' }
        )

    if (error) {
        console.error('Error recording attendance:', error)
        return { success: false, error: 'Erro ao registrar presença' }
    }

    revalidatePath(`/ebd`)
    return { success: true }
}
