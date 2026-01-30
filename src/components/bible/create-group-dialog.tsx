'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Loader2, CalendarIcon, Users, BookOpen } from 'lucide-react'
import { createGroupPlan, getAvailablePlans } from '@/actions/bible-reading'
import type { ReadingPlan } from '@/actions/bible-reading'
import { toast } from 'sonner'

interface CreateGroupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cellId: string
    cellName: string
}

export function CreateGroupDialog({
    open,
    onOpenChange,
    cellId,
    cellName
}: CreateGroupDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [plans, setPlans] = useState<ReadingPlan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)
    const [selectedPlanId, setSelectedPlanId] = useState<string>('')
    const [customName, setCustomName] = useState('')
    const today = new Date().toISOString().split('T')[0]
    const [startDate, setStartDate] = useState<string>(today)

    useEffect(() => {
        if (open) {
            loadPlans()
        }
    }, [open])

    const loadPlans = async () => {
        setLoadingPlans(true)
        const result = await getAvailablePlans()
        if (result.success && result.data) {
            setPlans(result.data)
            if (result.data.length > 0) {
                setSelectedPlanId(result.data[0].id)
            }
        }
        setLoadingPlans(false)
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    const getEndDate = (start: string, days: number) => {
        const date = new Date(start)
        date.setDate(date.getDate() + days)
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long'
        })
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long'
        })
    }

    const handleCreate = () => {
        if (!selectedPlanId) {
            toast.error('Selecione um plano')
            return
        }

        startTransition(async () => {
            const result = await createGroupPlan(
                selectedPlanId,
                cellId,
                customName || undefined,
                startDate
            )

            if (result.success) {
                toast.success('Plano de grupo criado com sucesso!')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao criar plano')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Criar Plano de Grupo
                    </DialogTitle>
                    <DialogDescription>
                        Crie um plano de leitura para a celula "{cellName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loadingPlans ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="plan">Plano de Leitura</Label>
                                <Select
                                    value={selectedPlanId}
                                    onValueChange={setSelectedPlanId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4" />
                                                    {plan.name} ({plan.duration_days} dias)
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Personalizado (opcional)</Label>
                                <Input
                                    id="name"
                                    placeholder={selectedPlan?.name || 'Ex: Leitura da Celula'}
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="group-start-date" className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Data de Inicio
                                </Label>
                                <Input
                                    id="group-start-date"
                                    type="date"
                                    value={startDate}
                                    min={today}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {selectedPlan && (
                                <div className="rounded-lg bg-muted p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Inicio:</span>
                                        <span className="font-medium">
                                            {formatDate(startDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Duracao:</span>
                                        <span className="font-medium">{selectedPlan.duration_days} dias</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Conclusao:</span>
                                        <span className="font-medium">
                                            {getEndDate(startDate, selectedPlan.duration_days)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isPending || !selectedPlanId}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Criar Plano
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
