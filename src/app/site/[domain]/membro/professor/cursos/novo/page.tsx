'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { teacherCreateCourse } from '@/actions/teacher'
import {
    ArrowLeft,
    BookOpen,
    Upload,
    Loader2,
    X
} from 'lucide-react'

export default function NovoCursoPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('O título é obrigatório')
            return
        }

        startTransition(async () => {
            const result = await teacherCreateCourse({
                title: title.trim(),
                description: description.trim() || undefined,
                thumbnail_url: thumbnailUrl.trim() || undefined
            })

            if (result.success && result.data) {
                router.push(`/membro/professor/cursos/${result.data.id}`)
            } else {
                setError(result.error || 'Erro ao criar curso')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <Link
                    href="/membro/professor/cursos"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Cursos
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Novo Curso
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                    Preencha as informações para criar um novo curso
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
                            Título do Curso *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Fundamentos da Fé"
                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o conteúdo do curso..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            URL da Imagem de Capa
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="url"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="flex-1 h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            {thumbnailUrl && (
                                <button
                                    type="button"
                                    onClick={() => setThumbnailUrl('')}
                                    className="h-12 w-12 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Cole a URL de uma imagem para usar como capa do curso
                        </p>
                    </div>

                    {/* Thumbnail Preview */}
                    {thumbnailUrl && (
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Preview da Capa
                            </label>
                            <div className="relative h-48 w-full rounded-xl overflow-hidden bg-muted/30 border border-border">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    onError={() => setThumbnailUrl('')}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/membro/professor/cursos"
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
                            'Criar Curso'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
