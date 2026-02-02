import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Play, CheckCircle, ArrowRight, Radio, Calendar, Clock } from 'lucide-react'

export default async function MeusCursosPage() {
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

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        thumbnail_url,
        course_videos (count)
      )
    `)
    .eq('profile_id', user.id)
    .eq('church_id', church.id)
    .order('enrolled_at', { ascending: false })

  // Get live lessons for enrolled courses
  const enrolledCourseIds = enrollments?.map((e: { course_id: string }) => e.course_id) || []

  // Get live lessons for enrolled courses (SCHEDULED or LIVE)
  const { data: liveLessons } = await supabase
    .from('course_live_lessons')
    .select('id, course_id, title, status, scheduled_start')
    .in('course_id', enrolledCourseIds.length > 0 ? enrolledCourseIds : ['null'])
    .in('status', ['SCHEDULED', 'LIVE'])
    .order('scheduled_start', { ascending: true })

  // Create a map of course_id to live lessons
  const liveLessonsByCoursde = liveLessons?.reduce((acc: any, lesson: any) => {
    if (!acc[lesson.course_id]) {
      acc[lesson.course_id] = []
    }
    acc[lesson.course_id].push(lesson)
    return acc
  }, {}) || {}

  // Get available courses (not enrolled)
  const { data: availableCourses } = await supabase
    .from('courses')
    .select(`
      *,
      course_videos (count)
    `)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .not('id', 'in', `(${enrolledCourseIds.join(',') || 'null'})`)
    .order('order_index', { ascending: true })

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">Crescimento</h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">Acompanhe seus cursos e trilhas de conhecimento</p>
      </div>

      {/* Enrolled Courses */}
      {enrollments && enrollments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-primary rounded-full" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight">Em Andamento</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {enrollments.map((enrollment: any) => {
              const course = enrollment.courses
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              // Check for live lessons
              const courseLiveLessons = liveLessonsByCoursde[course.id] || []
              const liveNow = courseLiveLessons.find((l: any) => l.status === 'LIVE')
              const nextScheduled = courseLiveLessons.find((l: any) => l.status === 'SCHEDULED')

              return (
                <div key={enrollment.id} className="relative">
                  <Link
                    href={`/membro/cursos/${course.id}`}
                    className="group block bg-card border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="relative h-36 sm:h-44 lg:h-48 w-full overflow-hidden">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <BookOpen className="w-10 sm:w-12 h-10 sm:h-12 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

                      {/* Live Badge */}
                      {liveNow && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-black uppercase shadow-lg animate-pulse">
                          <Radio className="w-3 h-3" />
                          AO VIVO
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8">
                      <h3 className="font-black text-base sm:text-lg lg:text-xl mb-3 sm:mb-4 text-foreground group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>

                      {/* Progress Bar */}
                      <div className="mb-4 sm:mb-6 bg-muted/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/50">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-xs sm:text-xs font-black uppercase tracking-widest text-muted-foreground">Progresso</span>
                          <span className="text-xs sm:text-sm font-black text-primary">
                            {enrollment.progress_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 sm:h-2.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 sm:pt-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-xs font-bold text-muted-foreground">
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/60" />
                          <span>{videoCount} aulas</span>
                        </div>
                        {enrollment.completed_at ? (
                          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs sm:text-xs font-black uppercase">
                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            Concluído
                          </div>
                        ) : (
                          <span className="text-primary text-xs sm:text-xs font-black uppercase tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 group-hover:gap-2 sm:group-hover:gap-3 transition-all">
                            Continuar <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Live Lesson Quick Access */}
                  {liveNow && (
                    <Link
                      href={`/membro/aulas-ao-vivo/${liveNow.id}`}
                      className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 p-3 bg-red-500/95 text-white rounded-xl shadow-xl backdrop-blur-sm hover:bg-red-600 transition-colors z-10"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="font-bold text-sm truncate">{liveNow.title}</span>
                      </div>
                      <span className="text-xs font-black uppercase whitespace-nowrap">Assistir</span>
                    </Link>
                  )}

                  {/* Scheduled Lesson Info */}
                  {!liveNow && nextScheduled && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 p-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl backdrop-blur-sm z-10">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">{nextScheduled.title}</p>
                        <p className="text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(nextScheduled.scheduled_start).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Available Courses */}
      {availableCourses && availableCourses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-muted-foreground/30 rounded-full" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight">Novas Trilhas</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {availableCourses.map((course: any) => {
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.id}`}
                  className="group bg-card border border-border/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/10 transition-all duration-300"
                >
                  <div className="relative h-28 sm:h-36 lg:h-44 w-full overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 lg:p-6">
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-muted-foreground">
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{videoCount} vídeos</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!enrollments || enrollments.length === 0) &&
        (!availableCourses || availableCourses.length === 0) && (
          <div className="text-center py-12 sm:py-16 lg:py-24 bg-card border border-dashed border-border rounded-2xl sm:rounded-3xl lg:rounded-4xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-muted rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">Nenhum curso disponível</h3>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Em breve teremos novos conteúdos preparados para você
            </p>
          </div>
        )}
    </div>
  )
}
