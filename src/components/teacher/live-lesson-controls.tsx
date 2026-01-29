'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    startLiveLesson,
    endLiveLesson,
    cancelLiveLesson
} from '@/actions/course-live-lessons'
import { Radio, Square, XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface LiveLessonControlsProps {
    lesson: {
        id: string
        course_id: string
        status: string
        title: string
    }
}

export function LiveLessonControls({ lesson }: LiveLessonControlsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showConfirmEnd, setShowConfirmEnd] = useState(false)
    const [showConfirmCancel, setShowConfirmCancel] = useState(false)
    const [error, setError] = useState('')

    const isScheduled = lesson.status === 'SCHEDULED'
    const isLive = lesson.status === 'LIVE'

    const handleStartLesson = () => {
        setError('')
        startTransition(async () => {
            const result = await startLiveLesson(lesson.id)
            if (result.success) {
                router.refresh()
            } else {
                setError(result.error || 'Erro ao iniciar aula')
            }
        })
    }

    const handleEndLesson = () => {
        setError('')
        startTransition(async () => {
            const result = await endLiveLesson(lesson.id)
            if (result.success) {
                setShowConfirmEnd(false)
                router.refresh()
            } else {
                setError(result.error || 'Erro ao encerrar aula')
            }
        })
    }

    const handleCancelLesson = () => {
        setError('')
        startTransition(async () => {
            const result = await cancelLiveLesson(lesson.id)
            if (result.success) {
                setShowConfirmCancel(false)
                router.push(`/membro/professor/cursos/${lesson.course_id}`)
            } else {
                setError(result.error || 'Erro ao cancelar aula')
            }
        })
    }

    return (
        <div className="bg-card border border-border/50 rounded-2xl p-6">
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm font-medium mb-4">
                    {error}
                </div>
            )}

            <h3 className="font-black text-lg text-foreground mb-4">
                Controles da Aula
            </h3>

            <div className="flex flex-wrap gap-4">
                {isScheduled && (
                    <>
                        <button
                            onClick={handleStartLesson}
                            disabled={isPending}
                            className="h-12 px-6 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Radio className="w-5 h-5" />
                                    Iniciar Aula ao Vivo
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowConfirmCancel(true)}
                            disabled={isPending}
                            className="h-12 px-6 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <XCircle className="w-5 h-5" />
                            Cancelar Aula
                        </button>
                    </>
                )}

                {isLive && (
                    <button
                        onClick={() => setShowConfirmEnd(true)}
                        disabled={isPending}
                        className="h-12 px-6 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Square className="w-5 h-5" />
                                Encerrar Aula
                            </>
                        )}
                    </button>
                )}
            </div>

            {isScheduled && (
                <p className="text-sm text-muted-foreground mt-4">
                    Ao iniciar a aula, os alunos poderão ver a transmissão ao vivo.
                    Certifique-se de estar com o OBS ou outro software configurado.
                </p>
            )}

            {isLive && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        Transmissão ao vivo em andamento
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Os alunos estão assistindo sua aula agora. Encerre quando terminar.
                    </p>
                </div>
            )}

            {/* End Confirmation Modal */}
            {showConfirmEnd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowConfirmEnd(false)}
                    />
                    <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-foreground">Encerrar Aula?</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Ao encerrar a aula, a transmissão será interrompida e a presença dos alunos será calculada.
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmEnd(false)}
                                className="h-11 px-5 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 font-bold text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEndLesson}
                                disabled={isPending}
                                className="h-11 px-5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Confirmar Encerramento'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showConfirmCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowConfirmCancel(false)}
                    />
                    <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-destructive/10 rounded-xl">
                                <XCircle className="w-6 h-6 text-destructive" />
                            </div>
                            <h3 className="text-xl font-black text-foreground">Cancelar Aula?</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Tem certeza que deseja cancelar esta aula? Os alunos não poderão mais acessá-la.
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmCancel(false)}
                                className="h-11 px-5 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 font-bold text-sm transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCancelLesson}
                                disabled={isPending}
                                className="h-11 px-5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Confirmar Cancelamento'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
