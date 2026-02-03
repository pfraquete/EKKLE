'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FeedPost, ROLE_LABELS, UserRole } from '@/types/feed'
import { FeedMediaGallery } from './feed-media-gallery'
import { approvePost, rejectPost } from '@/actions/feed'
import { useToast } from '@/hooks/use-toast'
import { Check, X, Loader2, Clock, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FeedModerationQueueProps {
    posts: FeedPost[]
}

export function FeedModerationQueue({ posts: initialPosts }: FeedModerationQueueProps) {
    const [posts, setPosts] = useState(initialPosts)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const { toast } = useToast()

    const handleApprove = async (postId: string) => {
        setProcessingId(postId)

        try {
            const result = await approvePost(postId)

            if (result.success) {
                setPosts((prev) => prev.filter((p) => p.id !== postId))
                toast({
                    title: 'Post aprovado',
                    description: 'A publicação agora está visível no feed',
                })
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
                description: 'Falha ao aprovar post',
                variant: 'destructive',
            })
        } finally {
            setProcessingId(null)
        }
    }

    const openRejectDialog = (postId: string) => {
        setSelectedPostId(postId)
        setRejectReason('')
        setRejectDialogOpen(true)
    }

    const handleReject = async () => {
        if (!selectedPostId) return

        setProcessingId(selectedPostId)

        try {
            const result = await rejectPost(selectedPostId, rejectReason || undefined)

            if (result.success) {
                setPosts((prev) => prev.filter((p) => p.id !== selectedPostId))
                setRejectDialogOpen(false)
                toast({
                    title: 'Post rejeitado',
                    description: 'O autor será notificado',
                })
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
                description: 'Falha ao rejeitar post',
                variant: 'destructive',
            })
        } finally {
            setProcessingId(null)
        }
    }

    if (posts.length === 0) {
        return (
            <Card className="border-none shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Inbox className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhum post pendente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Todos os posts foram revisados
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        {posts.length} {posts.length === 1 ? 'post aguardando' : 'posts aguardando'} aprovação
                    </h3>
                </div>

                {posts.map((post) => {
                    const author = post.author
                    const initials = author.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()

                    const timeAgo = formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                    })

                    const isProcessing = processingId === post.id

                    return (
                        <Card key={post.id} className="border-none shadow-sm">
                            <CardContent className="p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={author.photo_url || undefined}
                                                alt={author.full_name}
                                            />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">
                                                    {author.full_name}
                                                </span>
                                                {author.role !== 'MEMBER' && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {ROLE_LABELS[author.role as UserRole]}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {timeAgo}
                                            </span>
                                        </div>
                                    </div>

                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pendente
                                    </Badge>
                                </div>

                                {/* Content */}
                                <div className="mb-3 whitespace-pre-wrap text-foreground">
                                    {post.content}
                                </div>

                                {/* Media */}
                                {post.media && post.media.length > 0 && (
                                    <div className="mb-4">
                                        <FeedMediaGallery media={post.media} />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => openRejectDialog(post.id)}
                                        disabled={isProcessing}
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        {isProcessing && processingId === post.id ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4 mr-2" />
                                        )}
                                        Rejeitar
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(post.id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing && processingId === post.id ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4 mr-2" />
                                        )}
                                        Aprovar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar publicação</DialogTitle>
                        <DialogDescription>
                            Você pode informar um motivo para a rejeição (opcional).
                            O autor poderá ver este motivo.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        placeholder="Motivo da rejeição (opcional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="min-h-[100px]"
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={processingId !== null}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processingId !== null}
                        >
                            {processingId ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rejeitando...
                                </>
                            ) : (
                                'Confirmar rejeição'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
