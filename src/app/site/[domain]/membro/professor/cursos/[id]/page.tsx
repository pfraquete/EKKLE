import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTeacherCourseDetails } from '@/actions/teacher'
import {
    ArrowLeft,
    BookOpen,
    Users,
    Video,
    Radio,
    Plus,
    Eye,
    EyeOff,
    Settings,
    Calendar,
    Clock
} from 'lucide-react'
import { CourseSettingsForm } from '@/components/teacher/course-settings-form'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CursoDetalhesPage({ params }: PageProps) {
    const { id } = await params
    const church = await getChurch()
    const supabase = await createClient()

    if (!church) {
        redirect('/')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Check if user is a teacher
    if (!profile?.is_teacher && profile?.role !== 'PASTOR') {
        redirect('/membro')
    }

    const result = await getTeacherCourseDetails(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const course = result.data

    // Get live lessons with full data
    const { data: liveLessons } = await supabase
        .from('course_live_lessons')
        .select('*')
        .eq('course_id', id)
        .order('scheduled_start', { ascending: true })

    const upcomingLessons = liveLessons?.filter(l =>
        l.status === 'SCHEDULED' || l.status === 'LIVE'
    ) || []

    const pastLessons = liveLessons?.filter(l =>
        l.status === 'ENDED' || l.status === 'CANCELLED'
    ) || []

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href="/membro/professor/cursos"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Cursos
                </Link>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Course Thumbnail */}
                    <div className="relative w-full lg:w-80 h-48 lg:h-44 rounded-2xl overflow-hidden bg-muted/30 flex-shrink-0">
                        {course.thumbnail_url ? (
                            <Image
                                src={course.thumbnail_url}
                                alt={course.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                            {course.is_published ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-md">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-wider">Publicado</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md">
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-wider">Rascunho</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
                            {course.title}
                        </h1>
                        {course.description && (
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                                {course.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>{course.enrollments?.length || 0} alunos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Video className="w-4 h-4" />
                                <span>{course.videos?.length || 0} vídeos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Radio className="w-4 h-4" />
                                <span>{course.live_lessons?.length || 0} aulas ao vivo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link
                    href={`/membro/professor/cursos/${id}/aula-ao-vivo/nova`}
                    className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    Nova Aula ao Vivo
                </Link>
            </div>

            {/* Live Lessons Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                        Aulas ao Vivo
                    </h2>
                </div>

                {upcomingLessons.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingLessons.map((lesson: any) => (
                            <Link
                                key={lesson.id}
                                href={`/membro/professor/cursos/${id}/aula-ao-vivo/${lesson.id}`}
                                className="block bg-card border border-border/50 rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${
                                            lesson.status === 'LIVE'
                                                ? 'bg-red-500/10'
                                                : 'bg-primary/10'
                                        }`}>
                                            <Radio className={`w-5 h-5 ${
                                                lesson.status === 'LIVE'
                                                    ? 'text-red-500 animate-pulse'
                                                    : 'text-primary'
                                            }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground mb-1">
                                                {lesson.title}
                                            </h3>
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
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                                        lesson.status === 'LIVE'
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    }`}>
                                        {lesson.status === 'LIVE' ? 'Ao Vivo' : 'Agendada'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
                        <Radio className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground mb-4">Nenhuma aula ao vivo agendada</p>
                        <Link
                            href={`/membro/professor/cursos/${id}/aula-ao-vivo/nova`}
                            className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                        >
                            <Plus className="w-4 h-4" />
                            Agendar primeira aula
                        </Link>
                    </div>
                )}

                {pastLessons.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Aulas Anteriores
                        </h3>
                        <div className="space-y-2">
                            {pastLessons.slice(0, 5).map((lesson: any) => (
                                <div
                                    key={lesson.id}
                                    className="bg-muted/20 rounded-lg p-4 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-foreground">{lesson.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(lesson.scheduled_start).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        lesson.status === 'ENDED'
                                            ? 'bg-muted text-muted-foreground'
                                            : 'bg-destructive/10 text-destructive'
                                    }`}>
                                        {lesson.status === 'ENDED' ? 'Encerrada' : 'Cancelada'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Students Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                        Alunos Inscritos ({course.enrollments?.length || 0})
                    </h2>
                </div>

                {course.enrollments && course.enrollments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {course.enrollments.slice(0, 9).map((enrollment: any) => (
                            <div
                                key={enrollment.id}
                                className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4"
                            >
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                                    {enrollment.profile?.photo_url ? (
                                        <Image
                                            src={enrollment.profile.photo_url}
                                            alt={enrollment.profile.full_name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground truncate">
                                        {enrollment.profile?.full_name || 'Aluno'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${enrollment.progress_percentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {enrollment.progress_percentage || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
                        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Nenhum aluno inscrito ainda</p>
                    </div>
                )}
            </section>

            {/* Course Settings */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-muted-foreground/30 rounded-full" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                        Configurações do Curso
                    </h2>
                </div>

                <CourseSettingsForm course={course} />
            </section>
        </div>
    )
}
