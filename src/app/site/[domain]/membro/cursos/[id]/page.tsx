import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { CoursePlayer } from '@/components/courses/course-player'
import { enrollInCourse, getCourseEnrollment, getAllVideoProgress } from '@/actions/courses'
import { getProfile } from '@/actions/auth'

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
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-card border border-destructive/20 rounded-[2rem] p-12 text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl" />
            <h2 className="text-2xl font-black text-foreground mb-4 italic">Ops! Algo deu errado.</h2>
            <p className="text-muted-foreground font-medium mb-8">{result.error}</p>
            <Link
              href="/membro/cursos"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/10 transition-all hover:scale-105"
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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <Link
          href="/membro/cursos"
          className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Voltar para Meus Cursos
        </Link>

        <div className="bg-card border border-border/40 rounded-[3rem] p-20 text-center">
          <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground/10" />
          <h2 className="text-3xl font-black text-foreground mb-4 tracking-tighter italic">{course.title}</h2>
          <p className="text-muted-foreground font-medium">Este curso ainda não possui aulas liberadas para visualização.</p>
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

  // Get profile for comments
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <Link
          href="/membro/cursos"
          className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Voltar para Meus Cursos
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Ambiente de Aprendizado</span>
        </div>
      </div>

      <CoursePlayer
        course={course}
        videos={videos}
        currentVideo={currentVideo}
        enrollment={enrollment}
        videoProgress={videoProgress}
        profile={profile}
      />
    </div>
  )
}
