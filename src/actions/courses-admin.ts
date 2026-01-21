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
    const supabase = await createClient()

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...validated,
        church_id: profile.church_id,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) throw new Error('Erro ao criar curso')

    revalidatePath('/dashboard/cursos')
    revalidatePath('/', 'layout')

    return { success: true, course }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
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
    const supabase = await createClient()

    const { error } = await supabase
      .from('courses')
      .update(validated)
      .eq('id', courseId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao atualizar curso')

    revalidatePath('/dashboard/cursos')
    revalidatePath(`/dashboard/cursos/${courseId}`)
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
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
  } catch (error: any) {
    return { success: false, error: error.message }
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
  } catch (error) {
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
  } catch (error) {
    return null
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message }
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
  } catch (error: any) {
    return { success: false, error: error.message }
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
  } catch (error) {
    return []
  }
}
