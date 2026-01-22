'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CourseEnrollment = {
  id: string
  course_id: string
  profile_id: string
  enrolled_at: string
  completed_at: string | null
  progress_percentage: number
}

export type VideoProgress = {
  id: string
  video_id: string
  watched_seconds: number
  completed: boolean
  last_watched_at: string
}

/**
 * Enroll user in a course
 */
export async function enrollInCourse(courseId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Não autenticado')
    }

    // Get user profile to get church_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new Error('Perfil não encontrado')
    }

    // Check if course exists and is published
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('church_id', profile.church_id)
      .eq('is_published', true)
      .single()

    if (!course) {
      throw new Error('Curso não encontrado')
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('profile_id', user.id)
      .single()

    if (existingEnrollment) {
      throw new Error('Você já está inscrito neste curso')
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        profile_id: user.id,
        church_id: profile.church_id,
        progress_percentage: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao inscrever no curso')
    }

    revalidatePath('/membro/cursos')
    revalidatePath(`/membro/cursos/${courseId}`)
    revalidatePath(`/cursos/${courseId}`)

    return { success: true, enrollment: data }
  } catch (error: unknown) {
    console.error('Error enrolling in course:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Get user's enrollment for a course
 */
export async function getCourseEnrollment(courseId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('profile_id', user.id)
      .single()

    return enrollment
  } catch (error) {
    console.error('Error getting course enrollment:', error)
    return null
  }
}

/**
 * Update video progress
 */
export async function updateVideoProgress(input: {
  enrollmentId: string
  videoId: string
  watchedSeconds: number
  completed: boolean
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Não autenticado')
    }

    const { enrollmentId, videoId, watchedSeconds, completed } = input

    // Verify enrollment belongs to user
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id, course_id')
      .eq('id', enrollmentId)
      .eq('profile_id', user.id)
      .single()

    if (!enrollment) {
      throw new Error('Inscrição não encontrada')
    }

    // Upsert video progress
    const { error: progressError } = await supabase
      .from('course_video_progress')
      .upsert(
        {
          enrollment_id: enrollmentId,
          video_id: videoId,
          watched_seconds: watchedSeconds,
          completed,
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: 'enrollment_id,video_id',
        }
      )

    if (progressError) {
      throw new Error('Erro ao salvar progresso')
    }

    // Calculate overall course progress
    await updateCourseProgress(enrollmentId)

    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating video progress:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Calculate and update overall course progress
 */
async function updateCourseProgress(enrollmentId: string) {
  const supabase = await createClient()

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('course_id')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return

  // Get total videos and completed videos
  const { data: videos } = await supabase
    .from('course_videos')
    .select('id')
    .eq('course_id', enrollment.course_id)
    .eq('is_published', true)

  if (!videos || videos.length === 0) return

  const { data: completedVideos } = await supabase
    .from('course_video_progress')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .eq('completed', true)

  const totalVideos = videos.length
  const completedCount = completedVideos?.length || 0
  const progressPercentage = Math.round((completedCount / totalVideos) * 100)

  // Update enrollment progress
  const updateData: {
    progress_percentage: number
    completed_at?: string
  } = {
    progress_percentage: progressPercentage,
  }

  // Mark as completed if 100%
  if (progressPercentage === 100) {
    updateData.completed_at = new Date().toISOString()
  }

  await supabase
    .from('course_enrollments')
    .update(updateData)
    .eq('id', enrollmentId)

  revalidatePath('/membro/cursos')
}

/**
 * Get video progress for a specific video
 */
export async function getVideoProgress(enrollmentId: string, videoId: string) {
  try {
    const supabase = await createClient()

    const { data: progress } = await supabase
      .from('course_video_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('video_id', videoId)
      .single()

    return progress
  } catch {
    return null
  }
}

/**
 * Get all video progress for an enrollment
 */
export async function getAllVideoProgress(enrollmentId: string) {
  try {
    const supabase = await createClient()

    const { data: progress } = await supabase
      .from('course_video_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)

    return progress || []
  } catch (error) {
    console.error('Error getting video progress:', error)
    return []
  }
}
