'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { teacherUpdateCourse } from '@/actions/teacher'
import { Loader2, X, Eye, EyeOff, BookOpen } from 'lucide-react'

interface CourseSettingsFormProps {
    course: {
        id: string
        title: string
        description?: string
        thumbnail_url?: string
        is_published: boolean
    }
}

export function CourseSettingsForm({ course }: CourseSettingsFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState(course.title)
    const [description, setDescription] = useState(course.description || '')
    const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url || '')
    const [isPublished, setIsPublished] = useState(course.is_published)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!title.trim()) {
            setError('O título é obrigatório')
            return
        }

        startTransition(async () => {
            const result = await teacherUpdateCourse(course.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                thumbnail_url: thumbnailUrl.trim() || undefined,
                is_published: isPublished
            })

            if (result.success) {
                setSuccess(true)
                router.refresh()
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(result.error || 'Erro ao atualizar curso')
            }
        })
    }

    const handleTogglePublish = () => {
        startTransition(async () => {
            const newPublishState = !isPublished
            const result = await teacherUpdateCourse(course.id, {
                is_published: newPublishState
            })

            if (result.success) {
                setIsPublished(newPublishState)
                router.refresh()
            } else {
                setError(result.error || 'Erro ao atualizar status')
            }
        })
    }

    return (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-4 text-sm font-medium">
                        Curso atualizado com sucesso!
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">
                        Título do Curso
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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
                </div>

                {/* Thumbnail Preview */}
                {thumbnailUrl && (
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">
                            Preview
                        </label>
                        <div className="relative h-40 w-64 rounded-xl overflow-hidden bg-muted/30 border border-border">
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

                {/* Save Button */}
                <div className="flex items-center justify-end pt-4 border-t border-border">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </button>
                </div>
            </form>

            {/* Publish Section */}
            <div className="p-6 bg-muted/20 border-t border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-foreground mb-1">Status de Publicação</h4>
                        <p className="text-sm text-muted-foreground">
                            {isPublished
                                ? 'O curso está visível para os alunos'
                                : 'O curso está em modo rascunho'
                            }
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleTogglePublish}
                        disabled={isPending}
                        className={`h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
                            isPublished
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPublished ? (
                            <>
                                <EyeOff className="w-4 h-4" />
                                Despublicar
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                Publicar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
