'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CalendarIcon, BookOpen } from 'lucide-react'
import { startReadingPlan } from '@/actions/bible-reading'
import { toast } from 'sonner'

interface StartPlanDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: string
    planName: string
    durationDays: number
}

export function StartPlanDialog({
    open,
    onOpenChange,
    planId,
    planName,
    durationDays
}: StartPlanDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const today = new Date().toISOString().split('T')[0]
    const [startDate, setStartDate] = useState<string>(today)

    const getEndDate = (start: string) => {
        const date = new Date(start)
        date.setDate(date.getDate() + durationDays)
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handleStart = () => {
        startTransition(async () => {
            const result = await startReadingPlan(planId, startDate)

            if (result.success) {
                toast.success('Plano iniciado com sucesso!')
                onOpenChange(false)
                router.push('/membro/biblia/meu-plano')
            } else {
                toast.error(result.error || 'Erro ao iniciar plano')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Iniciar Plano de Leitura
                    </DialogTitle>
                    <DialogDescription>
                        Configure quando voce deseja comecar o plano "{planName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="start-date" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Data de Inicio
                        </Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            min={today}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Inicio:</span>
                            <span className="font-medium">
                                {formatDate(startDate)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duracao:</span>
                            <span className="font-medium">{durationDays} dias</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Conclusao prevista:</span>
                            <span className="font-medium">
                                {getEndDate(startDate)}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleStart} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Comecar Agora
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
