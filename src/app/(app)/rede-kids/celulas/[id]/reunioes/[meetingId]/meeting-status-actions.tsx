'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PlayCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { startKidsMeeting, completeKidsMeeting, cancelKidsMeeting, KidsMeeting } from '@/actions/kids-meetings'
import { toast } from 'sonner'

interface MeetingStatusActionsProps {
    meeting: KidsMeeting
    cellId: string
}

export function MeetingStatusActions({ meeting, cellId }: MeetingStatusActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [action, setAction] = useState<string | null>(null)

    const handleStart = async () => {
        setAction('start')
        startTransition(async () => {
            const result = await startKidsMeeting(meeting.id)
            if (result.success) {
                toast.success('Reuniao iniciada!')
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao iniciar reuniao')
            }
            setAction(null)
        })
    }

    const handleComplete = async () => {
        setAction('complete')
        startTransition(async () => {
            const result = await completeKidsMeeting(meeting.id)
            if (result.success) {
                toast.success('Reuniao finalizada com sucesso!')
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao finalizar reuniao')
            }
            setAction(null)
        })
    }

    const handleCancel = async () => {
        setAction('cancel')
        startTransition(async () => {
            const result = await cancelKidsMeeting(meeting.id)
            if (result.success) {
                toast.success('Reuniao cancelada')
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao cancelar reuniao')
            }
            setAction(null)
        })
    }

    if (meeting.status === 'SCHEDULED') {
        return (
            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-blue-700 font-medium">
                            Esta reuniao esta agendada. Inicie quando estiver pronto.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleStart}
                                disabled={isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isPending && action === 'start' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <PlayCircle className="w-4 h-4 mr-2" />
                                )}
                                Iniciar Reuniao
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancelar Reuniao?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza que deseja cancelar esta reuniao? Esta acao pode ser desfeita posteriormente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleCancel}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {isPending && action === 'cancel' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : null}
                                            Sim, Cancelar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (meeting.status === 'IN_PROGRESS') {
        return (
            <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-amber-700 font-medium">
                            Reuniao em andamento. Finalize quando terminar.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleComplete}
                                disabled={isPending}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isPending && action === 'complete' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Finalizar Reuniao
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return null
}
