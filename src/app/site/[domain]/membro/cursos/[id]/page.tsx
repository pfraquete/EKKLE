import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Play, Lock, Clock, CalendarClock } from 'lucide-react'
import { CoursePlayer } from '@/components/courses/course-player'
import { getCourseEnrollment, getAllVideoProgress } from '@/actions/courses'
import { getCourseLiveLessons } from '@/actions/course-live-lessons'
import { getProfile } from '@/actions/auth'
import { EnrollButton } from '@/components/courses/enroll-button'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ video?: string }>
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
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

  // Get course videos (needed for both preview and player)
  const { data: videos } = await supabase
    .from('course_videos')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  // =====================================================
  // NOT ENROLLED — Show course detail/preview page
  // =====================================================
  if (!enrollment) {
    const totalDuration = videos?.reduce((acc, video) => acc + (video.duration_seconds || 0), 0) || 0
    const enrollmentStartDate = course.enrollment_start_date ? new Date(course.enrollment_start_date) : null
    const enrollmentOpen = !enrollmentStartDate || enrollmentStartDate <= new Date()

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

        {/* Course Header */}
        <div className="bg-card border border-border/40 rounded-3xl overflow-hidden">
          {/* Thumbnail */}
          <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-muted-foreground/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          </div>

          {/* Course Info */}
          <div className="p-6 sm:p-8 lg:p-10 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-3">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {videos && videos.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {videos.length} {videos.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>
              )}
              {totalDuration > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {formatDuration(totalDuration)}
                  </span>
                </div>
              )}
            </div>

            {/* Enrollment Date Warning */}
            {!enrollmentOpen && enrollmentStartDate && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-600">
                <CalendarClock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Inscrições ainda não abertas</p>
                  <p className="text-sm mt-0.5">
                    As inscrições abrem em {enrollmentStartDate.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Enroll Button */}
            <EnrollButton
              courseId={courseId}
              isEnrolled={false}
              isAuthenticated={true}
              isEnrollmentOpen={enrollmentOpen}
            />
          </div>
        </div>

        {/* Video List (locked) */}
        {videos && videos.length > 0 && (
          <div className="bg-card border border-border/40 rounded-3xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border/40">
              <h2 className="text-lg font-black text-foreground uppercase tracking-widest">Conteúdo do Curso</h2>
            </div>
            <div className="divide-y divide-border/30">
              {videos.map((video, index) => (
                <div key={video.id} className="flex items-center gap-4 px-6 sm:px-8 py-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{video.title}</h3>
                    {video.duration_seconds > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(video.duration_seconds)}
                      </p>
                    )}
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // =====================================================
  // ENROLLED — Show course player (existing behavior)
  // =====================================================
  const liveLessonsResult = await getCourseLiveLessons(courseId)

  // Filter live lessons to only SCHEDULED and LIVE
  const liveLessons = (liveLessonsResult.data || []).filter(
    (l) => l.status === 'SCHEDULED' || l.status === 'LIVE'
  )

  const hasVideos = videos && videos.length > 0
  const hasLiveLessons = liveLessons.length > 0

  if (!hasVideos && !hasLiveLessons) {
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
  const videoProgress = hasVideos ? await getAllVideoProgress(enrollment.id) : []
  const progressMap = new Map(
    videoProgress.map((p) => [p.video_id, p])
  )

  // Determine which video to show
  const safeVideos = videos || []
  let currentVideo = safeVideos[0] || null
  if (videoId && safeVideos.length > 0) {
    const selectedVideo = safeVideos.find((v) => v.id === videoId)
    if (selectedVideo) {
      currentVideo = selectedVideo
    }
  } else if (safeVideos.length > 0) {
    // Find first incomplete video or last video
    const incompleteVideo = safeVideos.find((v) => !progressMap.get(v.id)?.completed)
    if (incompleteVideo) {
      currentVideo = incompleteVideo
    } else {
      currentVideo = safeVideos[safeVideos.length - 1]
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
        videos={safeVideos}
        currentVideo={currentVideo}
        enrollment={enrollment}
        videoProgress={videoProgress}
        profile={profile}
        liveLessons={liveLessons.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          scheduled_start: l.scheduled_start,
          status: l.status as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
          mux_playback_id: l.mux_playback_id,
        }))}
      />
    </div>
  )
}
