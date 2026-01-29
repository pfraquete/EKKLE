import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLiveLesson, getLessonAttendance } from '@/actions/course-live-lessons'
import {
    ArrowLeft,
    Radio,
    Calendar,
    Clock,
    Users,
    MessageSquare,
    Copy,
    ExternalLink
} from 'lucide-react'
import { LiveLessonControls } from '@/components/teacher/live-lesson-controls'
import { AttendanceList } from '@/components/teacher/attendance-list'

interface PageProps {
    params: Promise<{ id: string; lessonId: string }>
}

export default async function AulaAoVivoPage({ params }: PageProps) {
    const { id: courseId, lessonId } = await params
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

    const lessonResult = await getLiveLesson(lessonId)
    const attendanceResult = await getLessonAttendance(lessonId)

    if (!lessonResult.success || !lessonResult.data) {
        notFound()
    }

    const lesson = lessonResult.data
    const attendance = attendanceResult.success ? attendanceResult.data : []
    const onlineCount = attendance?.filter((a: any) => a.is_online).length || 0

    // Get course info
    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

    const isScheduled = lesson.status === 'SCHEDULED'
    const isLive = lesson.status === 'LIVE'
    const isEnded = lesson.status === 'ENDED' || lesson.status === 'CANCELLED'

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href={`/membro/professor/cursos/${courseId}`}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para {course?.title || 'Curso'}
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2.5 rounded-xl ${
                                isLive ? 'bg-red-500/10' : 'bg-primary/10'
                            }`}>
                                <Radio className={`w-6 h-6 ${
                                    isLive ? 'text-red-500 animate-pulse' : 'text-primary'
                                }`} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                                    {lesson.title}
                                </h1>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider mt-1 ${
                                    isLive
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        : isScheduled
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                }`}>
                                    {isLive ? 'Ao Vivo' : isScheduled ? 'Agendada' : lesson.status === 'CANCELLED' ? 'Cancelada' : 'Encerrada'}
                                </span>
                            </div>
                        </div>
                        {lesson.description && (
                            <p className="text-muted-foreground mt-2">
                                {lesson.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {new Date(lesson.scheduled_start).toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long'
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
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>{onlineCount} online agora</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" />
                                <span>{lesson.chat_enabled ? 'Chat ativado' : 'Chat desativado'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Controls */}
            {!isEnded && (
                <LiveLessonControls lesson={lesson} />
            )}

            {/* Streaming Info (when live or scheduled) */}
            {(isScheduled || isLive) && lesson.mux_stream_key && (
                <div className="bg-card border border-border/50 rounded-2xl p-6">
                    <h3 className="font-black text-lg text-foreground mb-4">
                        Informações de Transmissão
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-muted/30 rounded-xl p-4">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                RTMP Server
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm text-foreground bg-background px-3 py-2 rounded-lg border border-border font-mono">
                                    rtmps://global-live.mux.com:443/app
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('rtmps://global-live.mux.com:443/app')}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copiar"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Stream Key
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm text-foreground bg-background px-3 py-2 rounded-lg border border-border font-mono truncate">
                                    {lesson.mux_stream_key}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(lesson.mux_stream_key || '')}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copiar"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Use estas informações para configurar seu software de streaming (OBS, Streamlabs, etc.)
                        </p>
                    </div>
                </div>
            )}

            {/* Attendance */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                            Presença ({attendance?.length || 0})
                        </h2>
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold">{onlineCount} online</span>
                        </div>
                    )}
                </div>

                <AttendanceList attendance={attendance || []} isLive={isLive} />
            </section>

            {/* Recording (when ended) */}
            {isEnded && lesson.recording_url && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full" />
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                            Gravação
                        </h2>
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl p-6">
                        <p className="text-muted-foreground mb-4">
                            A gravação desta aula está disponível:
                        </p>
                        <a
                            href={lesson.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Assistir Gravação
                        </a>
                    </div>
                </section>
            )}
        </div>
    )
}
