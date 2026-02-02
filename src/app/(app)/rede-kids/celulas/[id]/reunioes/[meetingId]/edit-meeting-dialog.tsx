'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Edit, Loader2 } from 'lucide-react'
import { updateKidsMeeting, KidsMeeting } from '@/actions/kids-meetings'
import { toast } from 'sonner'

interface EditMeetingDialogProps {
    meeting: KidsMeeting
    cellId: string
}

export function EditMeetingDialog({ meeting, cellId }: EditMeetingDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time?.slice(0, 5) || '',
        theme: meeting.theme || '',
        bible_verse: meeting.bible_verse || '',
        notes: meeting.notes || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await updateKidsMeeting(meeting.id, {
                meeting_date: formData.meeting_date,
                meeting_time: formData.meeting_time || null,
                theme: formData.theme || null,
                bible_verse: formData.bible_verse || null,
                notes: formData.notes || null,
            })

            if (result.success) {
                toast.success('Reuniao atualizada com sucesso!')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao atualizar reuniao')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Reuniao</DialogTitle>
                    <DialogDescription>
                        Atualize as informacoes da reuniao
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="meeting_date">Data *</Label>
                            <Input
                                id="meeting_date"
                                type="date"
                                value={formData.meeting_date}
                                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meeting_time">Horario</Label>
                            <Input
                                id="meeting_time"
                                type="time"
                                value={formData.meeting_time}
                                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="theme">Tema</Label>
                        <Input
                            id="theme"
                            value={formData.theme}
                            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                            placeholder="Tema da reuniao"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bible_verse">Versiculo</Label>
                        <Input
                            id="bible_verse"
                            value={formData.bible_verse}
                            onChange={(e) => setFormData({ ...formData, bible_verse: e.target.value })}
                            placeholder="Ex: Joao 3:16"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observacoes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Notas adicionais..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
