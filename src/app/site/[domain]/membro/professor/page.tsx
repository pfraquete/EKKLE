import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTeacherDashboardStats, getTeacherCourses } from '@/actions/teacher'
import {
    GraduationCap,
    BookOpen,
    Users,
    Plus,
    Radio,
    Calendar,
    ArrowRight,
    Video,
    Clock
} from 'lucide-react'

export default async function ProfessorDashboardPage() {
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

    // Get teacher stats
    const statsResult = await getTeacherDashboardStats()
    const coursesResult = await getTeacherCourses()

    const stats = statsResult.success ? statsResult.data : null
    const courses = coursesResult.success ? coursesResult.data : []

    return (
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                            Área do Professor
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground font-medium">
                        Gerencie seus cursos e aulas ao vivo
                    </p>
                </div>
                <Link
                    href="/membro/professor/cursos/novo"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    Novo Curso
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground">
                        {stats?.coursesCount || 0}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        Cursos Criados
                    </div>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground">
                        {stats?.totalEnrollments || 0}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        Alunos Inscritos
                    </div>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground">
                        {stats?.upcomingLessons?.length || 0}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        Aulas Agendadas
                    </div>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-xl ${stats?.currentLesson ? 'bg-red-500/10' : 'bg-muted/50'}`}>
                            <Radio className={`w-5 h-5 ${stats?.currentLesson ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground">
                        {stats?.currentLesson ? 'AO VIVO' : '-'}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        Status da Live
                    </div>
                </div>
            </div>

            {/* Current Live Lesson Alert */}
            {stats?.currentLesson && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500 rounded-xl">
                                <Radio className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-foreground">
                                    {stats.currentLesson.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Aula ao vivo em andamento
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/membro/professor/cursos/${stats.currentLesson.course_id}/aula-ao-vivo/${stats.currentLesson.id}`}
                            className="inline-flex items-center gap-2 h-12 px-6 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all"
                        >
                            Ir para Aula
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            {/* My Courses */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
                            Meus Cursos
                        </h2>
                    </div>
                    <Link
                        href="/membro/professor/cursos"
                        className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                    >
                        Ver Todos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {courses && courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.slice(0, 6).map((course: any) => {
                            const enrollmentCount = Array.isArray(course._count)
                                ? course._count.length
                                : course._count?.count || 0

                            return (
                                <Link
                                    key={course.id}
                                    href={`/membro/professor/cursos/${course.id}`}
                                    className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                                >
                                    <div className="relative h-36 w-full overflow-hidden bg-muted/30">
                                        {course.thumbnail_url ? (
                                            <Image
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                course.is_published
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {course.is_published ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                <span>{enrollmentCount} alunos</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-black text-foreground mb-2">Nenhum curso criado</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Crie seu primeiro curso para começar a ensinar
                        </p>
                        <Link
                            href="/membro/professor/cursos/novo"
                            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Primeiro Curso
                        </Link>
                    </div>
                )}
            </section>

            {/* Upcoming Lessons */}
            {stats?.upcomingLessons && stats.upcomingLessons.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
                            Próximas Aulas
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {stats.upcomingLessons.map((lesson: any) => (
                            <div
                                key={lesson.id}
                                className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                        <Video className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{lesson.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {new Date(lesson.scheduled_start).toLocaleDateString('pt-BR', {
                                                    weekday: 'short',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/membro/professor/cursos/${lesson.course_id}/aula-ao-vivo/${lesson.id}`}
                                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    Gerenciar <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
