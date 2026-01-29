import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAvailableLiveLessons } from '@/actions/course-live-lessons'
import {
    Radio,
    Calendar,
    Clock,
    BookOpen,
    ArrowRight
} from 'lucide-react'

export default async function AulasAoVivoPage() {
    const church = await getChurch()
    const supabase = await createClient()

    if (!church) {
        redirect('/')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const result = await getAvailableLiveLessons()
    const lessons = result.success ? result.data : []

    const liveLessons = lessons?.filter((l: any) => l.status === 'LIVE') || []
    const scheduledLessons = lessons?.filter((l: any) => l.status === 'SCHEDULED') || []

    return (
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-red-500/10 rounded-xl">
                        <Radio className="w-6 h-6 text-red-500" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                        Aulas ao Vivo
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    Assista às aulas ao vivo dos seus cursos
                </p>
            </div>

            {/* Live Now Section */}
            {liveLessons.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
                            Ao Vivo Agora
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {liveLessons.map((lesson: any) => (
                            <Link
                                key={lesson.id}
                                href={`/membro/aulas-ao-vivo/${lesson.id}`}
                                className="block bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-red-500/10 transition-all"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-red-500/20 rounded-xl">
                                            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-foreground mb-1">
                                                {lesson.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {lesson.course?.title}
                                            </p>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                AO VIVO
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                        Assistir <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Scheduled Section */}
            {scheduledLessons.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                        <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
                            Próximas Aulas
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {scheduledLessons.map((lesson: any) => (
                            <div
                                key={lesson.id}
                                className="bg-card border border-border/50 rounded-xl p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                            <Calendar className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground mb-1">
                                                {lesson.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {lesson.course?.title}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {new Date(lesson.scheduled_start).toLocaleDateString('pt-BR', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {new Date(lesson.scheduled_start).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold uppercase">
                                        Agendada
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {liveLessons.length === 0 && scheduledLessons.length === 0 && (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
                    <Radio className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-xl font-black text-foreground mb-2">
                        Nenhuma aula ao vivo
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Não há aulas ao vivo disponíveis no momento. Inscreva-se em cursos para ver as aulas agendadas.
                    </p>
                    <Link
                        href="/membro/cursos"
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        <BookOpen className="w-4 h-4" />
                        Ver Meus Cursos
                    </Link>
                </div>
            )}
        </div>
    )
}
