import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Video, CalendarClock, ArrowRight } from 'lucide-react'

export default async function CursosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch all published courses with video counts
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      course_videos (count)
    `)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  return (
    <div className="py-24 bg-background animate-in fade-in duration-700">
      <div className="container mx-auto px-6">
        {/* Page Header */}
        <div className="mb-20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Academy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tighter italic">Nossos Cursos</h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium tracking-tight">
            Cresça espiritualmente com nossos cursos e trilhas de conhecimento fundamentadas na Palavra.
          </p>
        </div>

        {/* Courses Grid */}
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {courses.map((course) => {
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0
              const startDate = course.enrollment_start_date ? new Date(course.enrollment_start_date) : null
              const enrollmentLabel = startDate && startDate > new Date()
                ? `Início em ${startDate.toLocaleDateString('pt-BR')}`
                : 'Matrículas abertas'
              const priceLabel = course.is_paid
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((course.price_cents || 0) / 100)
                : 'Gratuito'

              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.id}`}
                  className="group bg-card border border-border/40 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500"
                >
                  <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground/10" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-card to-transparent opacity-80" />
                  </div>

                  <div className="p-5 sm:p-8 md:p-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                        {priceLabel}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest">
                        <Video className="w-3.5 h-3.5 text-primary" />
                        {videoCount} aulas
                      </div>
                    </div>

                    <h3 className="font-black text-2xl mb-4 text-foreground group-hover:text-primary transition-colors leading-[1.1]">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mb-8 line-clamp-2 font-medium">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>{enrollmentLabel}</span>
                      </div>
                      <span className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                        Matricular <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-[3rem]">
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground font-medium">
              Em breve teremos cursos incríveis para o seu crescimento.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 sm:mt-24 bg-primary/5 border border-primary/20 rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 md:p-20 text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tighter italic">
              Cresça conosco em comunidade
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Crie sua conta para acessar os cursos, acompanhar seu progresso e participar
              da nossa jornada de conhecimento.
            </p>
            <Link
              href="/registro"
              className="inline-block bg-primary text-primary-foreground px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-105 transition-all duration-300"
            >
              Começar Jornada Agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
