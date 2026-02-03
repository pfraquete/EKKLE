'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pin, PinOff, Pencil, Trash2, Loader2 } from 'lucide-react'
import { deletePost, togglePinPost } from '@/actions/feed'
import { useToast } from '@/hooks/use-toast'

interface FeedPostMenuProps {
    postId: string
    authorId: string
    currentUserId: string
    currentUserRole: string
    isPinned: boolean
    onDeleted?: () => void
    onEdit?: () => void
    onPinToggled?: (isPinned: boolean) => void
}

export function FeedPostMenu({
    postId,
    authorId,
    currentUserId,
    currentUserRole,
    isPinned,
    onDeleted,
    onEdit,
    onPinToggled,
}: FeedPostMenuProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPinning, setIsPinning] = useState(false)
    const { toast } = useToast()

    const isOwner = authorId === currentUserId
    const isPastor = currentUserRole === 'PASTOR'
    const canEdit = isOwner
    const canDelete = isOwner || isPastor
    const canPin = isPastor

    if (!canEdit && !canDelete && !canPin) {
        return null
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deletePost(postId)

            if (result.success) {
                toast({
                    title: 'Post excluído',
                    description: 'O post foi removido com sucesso',
                })
                onDeleted?.()
            } else {
                toast({
                    title: 'Erro',
                    description: result.error || 'Falha ao excluir post',
                    variant: 'destructive',
                })
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao excluir post',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
        }
    }

    const handleTogglePin = async () => {
        setIsPinning(true)
        try {
            const result = await togglePinPost(postId)

            if (result.success) {
                toast({
                    title: result.isPinned ? 'Post fixado' : 'Post desafixado',
                    description: result.isPinned
                        ? 'O post agora aparece no topo do feed'
                        : 'O post voltou à posição normal',
                })
                onPinToggled?.(result.isPinned!)
            } else {
                toast({
                    title: 'Erro',
                    description: result.error,
                    variant: 'destructive',
                })
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao fixar/desafixar post',
                variant: 'destructive',
            })
        } finally {
            setIsPinning(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canPin && (
                        <DropdownMenuItem
                            onClick={handleTogglePin}
                            disabled={isPinning}
                        >
                            {isPinning ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : isPinned ? (
                                <PinOff className="h-4 w-4 mr-2" />
                            ) : (
                                <Pin className="h-4 w-4 mr-2" />
                            )}
                            {isPinned ? 'Desafixar' : 'Fixar no topo'}
                        </DropdownMenuItem>
                    )}

                    {canEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                    )}

                    {canDelete && (
                        <>
                            {(canPin || canEdit) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O post e todas as suas
                            reações, comentários e mídias serão permanentemente excluídos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                'Excluir'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
