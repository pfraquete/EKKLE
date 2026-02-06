'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Calendar, ClipboardCheck, Trash2, Pencil, Link as LinkIcon } from 'lucide-react'
import { createEbdLesson, updateEbdLesson, deleteEbdLesson, EbdLesson } from '@/actions/ebd'
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
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [lessonDate, setLessonDate] = useState('')
    const [materialUrl, setMaterialUrl] = useState('')

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setLessonDate('')
        setMaterialUrl('')
        setShowForm(false)
        setEditingLessonId(null)
    }

    const startEdit = (lesson: EbdLesson) => {
        setEditingLessonId(lesson.id)
        setTitle(lesson.title)
        setDescription(lesson.description || '')
        setLessonDate(lesson.lesson_date)
        setMaterialUrl(lesson.material_url || '')
        setShowForm(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const result = await createEbdLesson({
                course_id: courseId,
                title,
                description,
                lesson_date: lessonDate,
                material_url: materialUrl || undefined,
            })
            if (result.success) {
                toast({ title: 'Lição criada' })
                resetForm()
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao criar lição', variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLessonId) return
        setIsSaving(true)
        try {
            const result = await updateEbdLesson(editingLessonId, {
                title,
                description,
                lesson_date: lessonDate,
                material_url: materialUrl || undefined,
            })
            if (result.success) {
                toast({ title: 'Lição atualizada' })
                resetForm()
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao atualizar lição', variant: 'destructive' })
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

    const renderForm = (mode: 'create' | 'edit') => (
        <form onSubmit={mode === 'create' ? handleCreate : handleUpdate} className="space-y-3 p-4 rounded-2xl border bg-muted/30">
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
            <div className="space-y-2">
                <Label htmlFor="material_url">Link do Material</Label>
                <Input
                    id="material_url"
                    type="url"
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    placeholder="https://exemplo.com/material.pdf"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : mode === 'create' ? <Plus className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
                    {mode === 'create' ? 'Criar' : 'Salvar'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                    Cancelar
                </Button>
            </div>
        </form>
    )

    return (
        <div className="space-y-4">
            {!showForm && !editingLessonId ? (
                <Button variant="outline" className="rounded-2xl" onClick={() => { resetForm(); setShowForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Lição
                </Button>
            ) : showForm ? (
                renderForm('create')
            ) : null}

            {lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma lição cadastrada.
                </p>
            ) : (
                <div className="divide-y divide-border">
                    {lessons.map(lesson => (
                        <div key={lesson.id}>
                            {editingLessonId === lesson.id ? (
                                renderForm('edit')
                            ) : (
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                {format(new Date(lesson.lesson_date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="font-medium text-sm truncate">{lesson.title}</span>
                                            {lesson.material_url && (
                                                <a href={lesson.material_url} target="_blank" rel="noopener noreferrer" title="Material">
                                                    <LinkIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => startEdit(lesson)}
                                            title="Editar lição"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
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
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
