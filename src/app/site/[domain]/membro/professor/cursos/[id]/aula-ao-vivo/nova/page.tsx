'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createLiveLesson } from '@/actions/course-live-lessons'
import {
    ArrowLeft,
    Radio,
    Calendar,
    Clock,
    Loader2,
    MessageSquare
} from 'lucide-react'

export default function NovaAulaAoVivoPage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params.id as string

    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('')
    const [duration, setDuration] = useState('60')
    const [chatEnabled, setChatEnabled] = useState(true)
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('O título é obrigatório')
            return
        }

        if (!scheduledDate || !scheduledTime) {
            setError('Data e hora são obrigatórios')
            return
        }

        const scheduledStart = new Date(`${scheduledDate}T${scheduledTime}`)
        if (scheduledStart <= new Date()) {
            setError('A data e hora devem ser no futuro')
            return
        }

        const scheduledEnd = new Date(scheduledStart.getTime() + parseInt(duration) * 60000)

        startTransition(async () => {
            const result = await createLiveLesson(courseId, {
                title: title.trim(),
                description: description.trim() || undefined,
                scheduled_start: scheduledStart.toISOString(),
                scheduled_end: scheduledEnd.toISOString(),
                chat_enabled: chatEnabled
            })

            if (result.success && result.data) {
                router.push(`/membro/professor/cursos/${courseId}/aula-ao-vivo/${result.data.id}`)
            } else {
                setError(result.error || 'Erro ao criar aula ao vivo')
            }
        })
    }

    // Get tomorrow's date as minimum for the date input
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate())
    const minDate = tomorrow.toISOString().split('T')[0]

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href={`/membro/professor/cursos/${courseId}`}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Curso
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Radio className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Nova Aula ao Vivo
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                    Agende uma nova aula ao vivo para seus alunos
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            Título da Aula *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Aula 01 - Introdução"
                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o conteúdo da aula..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Data *
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={minDate}
                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Horário *
                            </label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            Duração Estimada
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="30">30 minutos</option>
                            <option value="45">45 minutos</option>
                            <option value="60">1 hora</option>
                            <option value="90">1 hora e 30 min</option>
                            <option value="120">2 horas</option>
                            <option value="180">3 horas</option>
                        </select>
                    </div>

                    {/* Chat Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-bold text-foreground">Chat ao Vivo</p>
                                <p className="text-sm text-muted-foreground">
                                    Permitir que alunos enviem mensagens durante a aula
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setChatEnabled(!chatEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                chatEnabled ? 'bg-primary' : 'bg-muted'
                            }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    chatEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/membro/professor/cursos/${courseId}`}
                        className="h-12 px-6 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 font-bold text-sm flex items-center justify-center transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Agendar Aula'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
