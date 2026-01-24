import { getProfile } from '@/actions/auth'
import { adminGetCourses } from '@/actions/courses-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, BookOpen, Video, Eye, EyeOff } from 'lucide-react'

export default async function CursosAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')

  const courses = await adminGetCourses()

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter italic uppercase italic">Gerenciar Cursos</h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-2 bg-muted/30 px-3 py-1 rounded-full inline-block">Mata-fome espiritual • Ekkle Content</p>
        </div>
        <Link
          href="/dashboard/cursos/novo"
          className="bg-primary text-primary-foreground h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Novo Curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border/50 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30 animate-pulse" />
          <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter mb-2">Nenhum curso cadastrado</h3>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">Sua biblioteca de ensino está pronta para receber os primeiros conteúdos.</p>
          <Link
            href="/dashboard/cursos/novo"
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Curso
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: { id: string; thumbnail_url?: string; title: string; is_published: boolean; description?: string; modules_count?: number; is_paid?: boolean; price_cents?: number; course_videos: { count?: number } | Array<unknown> }) => {
            const videoCount = Array.isArray(course.course_videos) ? course.course_videos.length : course.course_videos?.count || 0
            const priceLabel = course.is_paid
              ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((course.price_cents || 0) / 100)}`
              : 'Gratuito'

            return (
              <Link
                key={course.id}
                href={`/dashboard/cursos/${course.id}`}
                className="group bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-56 w-full bg-muted/20 overflow-hidden">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {course.is_published ? (
                      <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Publicado</span>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Rascunho</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 flex flex-1 flex-col">
                  <h3 className="font-black text-xl text-foreground italic uppercase tracking-tighter line-clamp-2 mb-3 group-hover:text-primary transition-colors">{course.title}</h3>

                  {course.description && (
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6 line-clamp-2">{course.description}</p>
                  )}

                  <div className="mt-auto space-y-4 pt-4 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                          <Video className="w-3 h-3 text-primary" />
                          <span>{videoCount} {videoCount === 1 ? 'Aula' : 'Aulas'}</span>
                        </div>
                        <div className="bg-muted/50 px-2 py-1 rounded-lg">
                          <span>{course.modules_count || 0} Mód.</span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${course.is_paid ? 'text-primary' : 'text-emerald-500'}`}>
                        {priceLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
