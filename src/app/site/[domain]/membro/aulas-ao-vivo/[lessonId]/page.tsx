import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLiveLesson } from '@/actions/course-live-lessons'
import {
    ArrowLeft,
    Radio,
    Calendar,
    Clock,
    Users,
    MessageSquare
} from 'lucide-react'
import { LiveLessonPlayer } from '@/components/live-lesson/live-lesson-player'
import { LiveLessonChat } from '@/components/live-lesson/live-lesson-chat'

interface PageProps {
    params: Promise<{ lessonId: string }>
}

export default async function AssistirAulaPage({ params }: PageProps) {
    const { lessonId } = await params
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

    const result = await getLiveLesson(lessonId)

    if (!result.success || !result.data) {
        notFound()
    }

    const lesson = result.data

    // Get course info
    const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', lesson.course_id)
        .single()

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', lesson.course_id)
        .eq('profile_id', user.id)
        .single()

    // If not enrolled and lesson is live, check if user should have access
    const isTeacher = lesson.teacher_id === user.id
    const isPastor = profile?.role === 'PASTOR'

    if (!enrollment && !isTeacher && !isPastor) {
        // User is not enrolled
        redirect('/membro/aulas-ao-vivo')
    }

    const isLive = lesson.status === 'LIVE'
    const isScheduled = lesson.status === 'SCHEDULED'
    const isEnded = lesson.status === 'ENDED'

    // Get online count
    const { count: onlineCount } = await supabase
        .from('course_live_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)
        .eq('is_online', true)

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href="/membro/aulas-ao-vivo"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Aulas
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {isLive ? (
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    AO VIVO
                                </span>
                            ) : isScheduled ? (
                                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-sm font-bold">
                                    Aguardando início
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded-xl text-sm font-bold">
                                    Encerrada
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                            {lesson.title}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {course?.title}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{onlineCount || 0} assistindo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Player Section */}
                <div className="lg:col-span-2 space-y-4">
                    {isLive ? (
                        <LiveLessonPlayer
                            lessonId={lesson.id}
                            playbackId={lesson.mux_playback_id || undefined}
                            profileId={profile?.id}
                        />
                    ) : isScheduled ? (
                        <div className="aspect-video bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8">
                            <Calendar className="w-16 h-16 text-amber-500/50 mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                                Aula Agendada
                            </h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Esta aula ainda não começou. Volte no horário agendado.
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-lg">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    <span>
                                        {new Date(lesson.scheduled_start).toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: 'long'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-lg">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <span>
                                        {new Date(lesson.scheduled_start).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-video bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8">
                            <Radio className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                                Aula Encerrada
                            </h3>
                            <p className="text-muted-foreground text-center">
                                Esta aula ao vivo já foi encerrada.
                            </p>
                            {lesson.recording_url && (
                                <a
                                    href={lesson.recording_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-primary font-bold hover:underline"
                                >
                                    Assistir gravação
                                </a>
                            )}
                        </div>
                    )}

                    {/* Lesson Description */}
                    {lesson.description && (
                        <div className="bg-card border border-border/50 rounded-xl p-5">
                            <h4 className="font-bold text-foreground mb-2">Sobre esta aula</h4>
                            <p className="text-muted-foreground text-sm">
                                {lesson.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="lg:col-span-1">
                    {lesson.chat_enabled && isLive ? (
                        <LiveLessonChat
                            lessonId={lesson.id}
                            profileId={profile?.id}
                            profileName={profile?.full_name}
                            profilePhoto={profile?.photo_url}
                            isTeacher={isTeacher}
                        />
                    ) : !lesson.chat_enabled ? (
                        <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center h-96">
                            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm text-center">
                                O chat está desativado para esta aula
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center h-96">
                            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm text-center">
                                {isScheduled
                                    ? 'O chat será habilitado quando a aula começar'
                                    : 'Chat não disponível'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
