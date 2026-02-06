'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Calendar, ClipboardCheck, Trash2 } from 'lucide-react'
import { createEbdLesson, deleteEbdLesson, EbdLesson } from '@/actions/ebd'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface EbdLessonsListProps {
    courseId: string
    lessons: EbdLesson[]
}

export function EbdLessonsList({ courseId, lessons }: EbdLessonsListProps) {
    const { toast } = useToast()
    const [showForm, setShowForm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [lessonDate, setLessonDate] = useState('')

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const result = await createEbdLesson({
                course_id: courseId,
                title,
                description,
                lesson_date: lessonDate,
            })
            if (result.success) {
                toast({ title: 'Lição criada' })
                setShowForm(false)
                setTitle('')
                setDescription('')
                setLessonDate('')
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao criar lição', variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (lessonId: string) => {
        setDeletingId(lessonId)
        try {
            const result = await deleteEbdLesson(lessonId, courseId)
            if (result.success) {
                toast({ title: 'Lição excluída' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao excluir lição', variant: 'destructive' })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-4">
            {!showForm ? (
                <Button variant="outline" className="rounded-2xl" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Lição
                </Button>
            ) : (
                <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-2xl border bg-muted/30">
                    <div className="space-y-2">
                        <Label htmlFor="lesson_title">Título da Lição *</Label>
                        <Input
                            id="lesson_title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Lição 1 - A Criação"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lesson_date">Data *</Label>
                        <Input
                            id="lesson_date"
                            type="date"
                            value={lessonDate}
                            onChange={(e) => setLessonDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lesson_desc">Descrição</Label>
                        <Textarea
                            id="lesson_desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Resumo da lição..."
                            rows={2}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={isSaving} size="sm">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                            Criar
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}

            {lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma lição cadastrada.
                </p>
            ) : (
                <div className="divide-y divide-border">
                    {lessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                                        {format(new Date(lesson.lesson_date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                                    </Badge>
                                </div>
                                <span className="font-medium text-sm truncate">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Link href={`/ebd/${courseId}/licoes/${lesson.id}/presenca`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar presença">
                                        <ClipboardCheck className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => handleDelete(lesson.id)}
                                    disabled={deletingId === lesson.id}
                                >
                                    {deletingId === lesson.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
