import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CoursePlayer } from '@/components/courses/course-player'
import { enrollInCourse, getCourseEnrollment, getAllVideoProgress } from '@/actions/courses'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ video?: string }>
}

export default async function MemberCoursePage({ params, searchParams }: PageProps) {
  const { id: courseId } = await params
  const { video: videoId } = await searchParams

  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .single()

  if (!course) {
    notFound()
  }

  // Get enrollment
  const enrollment = await getCourseEnrollment(courseId)

  if (!enrollment) {
    // Auto-enroll if not enrolled
    const result = await enrollInCourse(courseId)
    if (!result.success) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao Acessar Curso</h2>
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/membro/cursos"
              className="mt-4 inline-block text-primary hover:underline"
            >
              Voltar para Meus Cursos
            </Link>
          </div>
        </div>
      )
    }
    // Redirect to reload with enrollment
    redirect(`/membro/cursos/${courseId}`)
  }

  // Get course videos
  const { data: videos } = await supabase
    .from('course_videos')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (!videos || videos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/membro/cursos"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Meus Cursos
        </Link>
        <div className="bg-gray-50 border rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
          <p className="text-gray-600">Este curso ainda não possui vídeos disponíveis.</p>
        </div>
      </div>
    )
  }

  // Get all video progress
  const videoProgress = await getAllVideoProgress(enrollment.id)
  const progressMap = new Map(
    videoProgress.map((p) => [p.video_id, p])
  )

  // Determine which video to show
  let currentVideo = videos[0]
  if (videoId) {
    const selectedVideo = videos.find((v) => v.id === videoId)
    if (selectedVideo) {
      currentVideo = selectedVideo
    }
  } else {
    // Find first incomplete video or last video
    const incompleteVideo = videos.find((v) => !progressMap.get(v.id)?.completed)
    if (incompleteVideo) {
      currentVideo = incompleteVideo
    } else {
      currentVideo = videos[videos.length - 1]
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/membro/cursos"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Meus Cursos
      </Link>

      <CoursePlayer
        course={course}
        videos={videos}
        currentVideo={currentVideo}
        enrollment={enrollment}
        videoProgress={videoProgress}
      />
    </div>
  )
}
