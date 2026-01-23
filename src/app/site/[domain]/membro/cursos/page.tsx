import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Play, CheckCircle, ArrowRight } from 'lucide-react'

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

  // Get available courses (not enrolled)
  const enrolledCourseIds = enrollments?.map((e: { course_id: string }) => e.course_id) || []
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
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Crescimento</h1>
        <p className="text-muted-foreground font-medium mt-1">Acompanhe seus cursos e trilhas de conhecimento</p>
      </div>

      {/* Enrolled Courses */}
      {enrollments && enrollments.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Em Andamento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enrollment: any) => {
              const course = enrollment.courses
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              return (
                <Link
                  key={enrollment.id}
                  href={`/membro/cursos/${course.id}`}
                  className="group bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="p-8">
                    <h3 className="font-black text-xl mb-4 text-foreground group-hover:text-primary transition-colors">{course.title}</h3>

                    {/* Progress Bar */}
                    <div className="mb-6 bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso</span>
                        <span className="text-sm font-black text-primary">
                          {enrollment.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Play className="w-4 h-4 text-primary/60" />
                        <span>{videoCount} aulas</span>
                      </div>
                      {enrollment.completed_at ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Concluído
                        </div>
                      ) : (
                        <span className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                          Continuar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Available Courses */}
      {availableCourses && availableCourses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-muted-foreground/30 rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Novas Trilhas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course: any) => {
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.id}`}
                  className="group bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/10 transition-all duration-300"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Play className="w-3.5 h-3.5" />
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
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-4xl">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground font-medium">
              Em breve teremos novos conteúdos preparados para você
            </p>
          </div>
        )}
    </div>
  )
}
