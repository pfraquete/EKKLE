'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const courseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean().default(false),
  order_index: z.number().default(0),
  modules_count: z.number().min(0).default(0),
  is_paid: z.boolean().default(false),
  price_cents: z.number().min(0).default(0),
  enrollment_start_date: z.string().optional().or(z.literal('')),
})

const videoSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  video_url: z.string().min(1, 'URL do vídeo é obrigatória'),
  duration_seconds: z.number().default(0),
  order_index: z.number().default(0),
  is_published: z.boolean().default(false),
})

type CourseInput = z.infer<typeof courseSchema>
type VideoInput = z.infer<typeof videoSchema>

// ==================== COURSES ====================

export async function adminCreateCourse(data: CourseInput) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const validated = courseSchema.parse(data)
    const enrollmentStartDate = validated.enrollment_start_date
      ? new Date(validated.enrollment_start_date).toISOString()
      : null
    const supabase = await createClient()

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...validated,
        enrollment_start_date: enrollmentStartDate,
        church_id: profile.church_id,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) throw new Error('Erro ao criar curso')

    revalidatePath('/dashboard/cursos')
    revalidatePath('/', 'layout')

    return { success: true, course }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminUpdateCourse(courseId: string, data: CourseInput) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const validated = courseSchema.parse(data)
    const enrollmentStartDate = validated.enrollment_start_date
      ? new Date(validated.enrollment_start_date).toISOString()
      : null
    const supabase = await createClient()

    const { error } = await supabase
      .from('courses')
      .update({
        ...validated,
        enrollment_start_date: enrollmentStartDate,
      })
      .eq('id', courseId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao atualizar curso')

    revalidatePath('/dashboard/cursos')
    revalidatePath(`/dashboard/cursos/${courseId}`)
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminDeleteCourse(courseId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem excluir cursos')

    const supabase = await createClient()
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao excluir curso')

    revalidatePath('/dashboard/cursos')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminGetCourses() {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`*, course_videos(count)`)
      .eq('church_id', profile.church_id)
      .order('order_index', { ascending: true })

    if (error) throw new Error('Erro ao buscar cursos')
    return courses || []
  } catch {
    return []
  }
}

export async function adminGetCourse(courseId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('church_id', profile.church_id)
      .single()

    if (error) throw new Error('Erro ao buscar curso')
    return course
  } catch {
    return null
  }
}

export async function adminGetCourseEnrollments(courseId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const supabase = await createClient()
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select('id, enrolled_at, completed_at, progress_percentage, profiles (id, full_name, email)')
      .eq('course_id', courseId)
      .eq('church_id', profile.church_id)
      .order('enrolled_at', { ascending: false })

    if (error) throw new Error('Erro ao buscar inscrições')

    return enrollments || []
  } catch {
    return []
  }
}

// ==================== VIDEOS ====================

export async function adminCreateVideo(courseId: string, data: VideoInput) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const validated = videoSchema.parse(data)
    const supabase = await createClient()

    // Verify course belongs to church
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('church_id', profile.church_id)
      .single()

    if (!course) throw new Error('Curso não encontrado')

    const { data: video, error } = await supabase
      .from('course_videos')
      .insert({
        ...validated,
        course_id: courseId,
        church_id: profile.church_id,
      })
      .select()
      .single()

    if (error) throw new Error('Erro ao criar vídeo')

    revalidatePath(`/dashboard/cursos/${courseId}`)
    revalidatePath('/', 'layout')

    return { success: true, video }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminUpdateVideo(videoId: string, data: VideoInput) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const validated = videoSchema.parse(data)
    const supabase = await createClient()

    const { error } = await supabase
      .from('course_videos')
      .update(validated)
      .eq('id', videoId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao atualizar vídeo')

    revalidatePath('/dashboard/cursos')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminDeleteVideo(videoId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem excluir vídeos')

    const supabase = await createClient()
    const { error } = await supabase
      .from('course_videos')
      .delete()
      .eq('id', videoId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao excluir vídeo')

    revalidatePath('/dashboard/cursos')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function adminGetCourseVideos(courseId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()
    const { data: videos, error } = await supabase
      .from('course_videos')
      .select('*')
      .eq('course_id', courseId)
      .eq('church_id', profile.church_id)
      .order('order_index', { ascending: true })

    if (error) throw new Error('Erro ao buscar vídeos')
    return videos || []
  } catch {
    return []
  }
}

export async function adminUploadCourseVideo(courseId: string, file: File) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo inválido. Use MP4, WebM, OGG ou MOV.' }
    }

    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 500MB.' }
    }

    const supabase = await createClient()
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${profile.church_id}/${courseId}/video-${timestamp}.${extension}`

    const { data, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: 'Erro ao fazer upload do vídeo' }
    }

    return { success: true, path: `course-videos/${data.path}` }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}
