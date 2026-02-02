'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Trash2, Loader2 } from 'lucide-react'
import { deleteKidsChild } from '@/actions/kids-children'
import { toast } from 'sonner'

interface DeleteChildDialogProps {
    childId: string
    childName: string
}

export function DeleteChildDialog({ childId, childName }: DeleteChildDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteKidsChild(childId)

            if (result.success) {
                toast.success('Crianca removida com sucesso')
                router.push('/rede-kids/criancas')
            } else {
                toast.error(result.error || 'Erro ao remover crianca')
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remover Crianca</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja remover <strong>{childName}</strong> do sistema?
                        Esta acao pode ser desfeita entrando em contato com o suporte.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Removendo...
                            </>
                        ) : (
                            'Sim, Remover'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
