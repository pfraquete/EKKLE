'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft,
    Calendar,
    Clock,
    BookOpen,
    BookMarked,
    FileText,
    Loader2,
    Save
} from 'lucide-react'
import { createKidsMeeting } from '@/actions/kids-meetings'
import { getKidsCell } from '@/actions/kids-cells'
import { toast } from 'sonner'

interface KidsCell {
    id: string
    name: string
}

export default function NovaReuniaoPage() {
    const router = useRouter()
    const params = useParams()
    const cellId = params.id as string
    const [isPending, startTransition] = useTransition()
    const [cell, setCell] = useState<KidsCell | null>(null)
    const [formData, setFormData] = useState({
        meeting_date: '',
        meeting_time: '',
        theme: '',
        bible_verse: '',
        notes: '',
    })

    useEffect(() => {
        async function loadCell() {
            const data = await getKidsCell(cellId)
            if (data) {
                setCell({ id: data.id, name: data.name })
                // Set default time from cell if available
                if (data.meeting_time) {
                    setFormData(prev => ({
                        ...prev,
                        meeting_time: data.meeting_time?.slice(0, 5) || ''
                    }))
                }
            }
        }
        loadCell()
    }, [cellId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await createKidsMeeting({
                kids_cell_id: cellId,
                meeting_date: formData.meeting_date,
                meeting_time: formData.meeting_time || null,
                theme: formData.theme || null,
                bible_verse: formData.bible_verse || null,
                notes: formData.notes || null,
            })

            if (result.success) {
                toast.success('Reuniao agendada com sucesso!')
                router.push(`/rede-kids/celulas/${cellId}/reunioes`)
            } else {
                toast.error(result.error || 'Erro ao agendar reuniao')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/rede-kids/celulas/${cellId}/reunioes`}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Nova Reuniao</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {cell?.name || 'Carregando...'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Data e Horario */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-primary" />
                            Data e Horario
                        </CardTitle>
                        <CardDescription>
                            Quando sera a reuniao
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Data *
                                </Label>
                                <Input
                                    id="meeting_date"
                                    type="date"
                                    value={formData.meeting_date}
                                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meeting_time" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Horario
                                </Label>
                                <Input
                                    id="meeting_time"
                                    type="time"
                                    value={formData.meeting_time}
                                    onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Conteudo da Reuniao */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-blue-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            Conteudo
                        </CardTitle>
                        <CardDescription>
                            Tema e versiculo da reuniao
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="theme" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Tema da Reuniao
                            </Label>
                            <Input
                                id="theme"
                                value={formData.theme}
                                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                placeholder="Ex: A historia de Davi"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bible_verse" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <BookMarked className="w-3 h-3" />
                                Versiculo Biblico
                            </Label>
                            <Input
                                id="bible_verse"
                                value={formData.bible_verse}
                                onChange={(e) => setFormData({ ...formData, bible_verse: e.target.value })}
                                placeholder="Ex: 1 Samuel 17:45"
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Observacoes */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-amber-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="w-5 h-5 text-amber-500" />
                            Observacoes
                        </CardTitle>
                        <CardDescription>
                            Notas e informacoes adicionais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Notas
                            </Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Lembretes, materiais necessarios, etc..."
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Link href={`/rede-kids/celulas/${cellId}/reunioes`} className="flex-1">
                        <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-bold">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isPending || !formData.meeting_date}
                        className="flex-1 h-12 rounded-xl font-bold shadow-lg"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Agendando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Agendar Reuniao
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
