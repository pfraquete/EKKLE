import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTeacherCourses } from '@/actions/teacher'
import {
    GraduationCap,
    BookOpen,
    Users,
    Plus,
    Eye,
    EyeOff,
    ArrowLeft,
    Video
} from 'lucide-react'

export default async function ProfessorCursosPage() {
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

    const coursesResult = await getTeacherCourses()
    const courses = coursesResult.success ? coursesResult.data : []

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href="/membro/professor"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Dashboard
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                                Meus Cursos
                            </h1>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground font-medium">
                            Gerencie todos os seus cursos
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
            </div>

            {/* Courses Grid */}
            {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course: any) => {
                        const enrollmentCount = Array.isArray(course._count)
                            ? course._count.length
                            : course._count?.count || 0

                        return (
                            <Link
                                key={course.id}
                                href={`/membro/professor/cursos/${course.id}`}
                                className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="relative h-40 w-full overflow-hidden bg-muted/30">
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
                                            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        {course.is_published ? (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-md">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Publicado</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md">
                                                <EyeOff className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Rascunho</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    {course.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {course.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            <span>{enrollmentCount} alunos</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Video className="w-4 h-4" />
                                            <span>{course.videos?.length || 0} aulas</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-24 bg-card border border-dashed border-border rounded-3xl">
                    <GraduationCap className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
                    <h3 className="text-2xl font-black text-foreground mb-2">Nenhum curso criado</h3>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        Crie seu primeiro curso para começar a compartilhar conhecimento com seus alunos
                    </p>
                    <Link
                        href="/membro/professor/cursos/novo"
                        className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Curso
                    </Link>
                </div>
            )}
        </div>
    )
}
