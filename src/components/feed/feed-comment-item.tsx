'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FeedPostComment, ROLE_LABELS, UserRole } from '@/types/feed'
import { FeedCommentForm } from './feed-comment-form'
import { MoreHorizontal, Reply, Trash2, Pin, PinOff, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { deleteComment, togglePinComment } from '@/actions/feed'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FeedCommentItemProps {
    comment: FeedPostComment
    postId: string
    currentUserId: string
    currentUserRole: string
    onDeleted?: (commentId: string) => void
    onReplyCreated?: (comment: FeedPostComment) => void
    isReply?: boolean
}

export function FeedCommentItem({
    comment,
    postId,
    currentUserId,
    currentUserRole,
    onDeleted,
    onReplyCreated,
    isReply = false,
}: FeedCommentItemProps) {
    const [isReplying, setIsReplying] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPinning, setIsPinning] = useState(false)
    const [localComment, setLocalComment] = useState(comment)
    const { toast } = useToast()

    const author = localComment.author
    const initials = author.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const timeAgo = formatDistanceToNow(new Date(localComment.created_at), {
        addSuffix: true,
        locale: ptBR,
    })

    const isOwner = localComment.author_id === currentUserId
    const isPastor = currentUserRole === 'PASTOR'
    const canDelete = isOwner || isPastor
    const canPin = isPastor && !isReply

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteComment(localComment.id)

            if (result.success) {
                onDeleted?.(localComment.id)
                toast({
                    title: 'Comentário excluído',
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
                description: 'Falha ao excluir comentário',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleTogglePin = async () => {
        setIsPinning(true)
        try {
            const result = await togglePinComment(localComment.id)

            if (result.success) {
                setLocalComment(prev => ({ ...prev, is_pinned: result.isPinned! }))
                toast({
                    title: result.isPinned ? 'Comentário fixado' : 'Comentário desafixado',
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
                description: 'Falha ao fixar comentário',
                variant: 'destructive',
            })
        } finally {
            setIsPinning(false)
        }
    }

    const handleReplyCreated = (newReply: FeedPostComment) => {
        setIsReplying(false)
        onReplyCreated?.(newReply)
    }

    return (
        <div className={cn('group', isReply && 'ml-10')}>
            <div className={cn(
                'flex gap-3 p-2 rounded-lg',
                localComment.is_pinned && 'bg-primary/5'
            )}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={author.photo_url || undefined} alt={author.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                            {author.full_name}
                        </span>
                        {author.role !== 'MEMBER' && (
                            <Badge variant="secondary" className="text-xs h-5">
                                {ROLE_LABELS[author.role as UserRole]}
                            </Badge>
                        )}
                        {localComment.is_pinned && (
                            <Badge variant="outline" className="text-xs h-5 text-primary border-primary">
                                <Pin className="h-3 w-3 mr-1" />
                                Fixado
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {timeAgo}
                        </span>
                    </div>

                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                        {localComment.content}
                    </p>

                    {/* Reply button */}
                    {!isReply && (
                        <div className="flex items-center gap-2 mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setIsReplying(!isReplying)}
                            >
                                <Reply className="h-3 w-3 mr-1" />
                                Responder
                            </Button>
                        </div>
                    )}
                </div>

                {/* Actions menu */}
                {(canDelete || canPin) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canPin && (
                                <DropdownMenuItem onClick={handleTogglePin} disabled={isPinning}>
                                    {isPinning ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : localComment.is_pinned ? (
                                        <PinOff className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Pin className="h-4 w-4 mr-2" />
                                    )}
                                    {localComment.is_pinned ? 'Desafixar' : 'Fixar'}
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-destructive focus:text-destructive"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Excluir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Reply form */}
            {isReplying && (
                <div className="ml-11 mt-2">
                    <FeedCommentForm
                        postId={postId}
                        parentId={localComment.id}
                        placeholder={`Responder a ${author.full_name}...`}
                        onCommentCreated={handleReplyCreated}
                        onCancel={() => setIsReplying(false)}
                    />
                </div>
            )}

            {/* Replies */}
            {localComment.replies && localComment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {localComment.replies.map(reply => (
                        <FeedCommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onDeleted={onDeleted}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
