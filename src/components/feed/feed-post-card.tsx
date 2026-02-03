'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FeedPost, FeedSettings, ReactionType, ROLE_LABELS, UserRole, POST_STATUS_LABELS } from '@/types/feed'
import { FeedMediaGallery } from './feed-media-gallery'
import { FeedReactions } from './feed-reactions'
import { FeedPostMenu } from './feed-post-menu'
import { FeedComments } from './feed-comments'
import { Pin, MessageCircle, Clock, XCircle, Loader2, Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { updatePost } from '@/actions/feed'
import { useToast } from '@/hooks/use-toast'

interface FeedPostCardProps {
    post: FeedPost
    settings: FeedSettings
    currentUserId: string
    currentUserRole: string
    onDeleted?: () => void
}

export function FeedPostCard({
    post,
    settings,
    currentUserId,
    currentUserRole,
    onDeleted,
}: FeedPostCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)
    const [isSaving, setIsSaving] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [localPost, setLocalPost] = useState(post)
    const { toast } = useToast()

    const author = localPost.author
    const initials = author.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const timeAgo = formatDistanceToNow(new Date(localPost.created_at), {
        addSuffix: true,
        locale: ptBR,
    })

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return

        setIsSaving(true)
        try {
            const result = await updatePost(localPost.id, editContent)

            if (result.success) {
                setLocalPost(prev => ({ ...prev, content: editContent }))
                setIsEditing(false)
                toast({
                    title: 'Post atualizado',
                    description: 'Suas alterações foram salvas',
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
                description: 'Falha ao salvar alterações',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setEditContent(localPost.content)
        setIsEditing(false)
    }

    const handleReactionChange = (newReaction: ReactionType | null) => {
        setLocalPost(prev => ({
            ...prev,
            user_reaction: newReaction,
            reactions_count: newReaction
                ? prev.user_reaction ? prev.reactions_count : prev.reactions_count + 1
                : prev.reactions_count - 1,
        }))
    }

    const handlePinToggled = (isPinned: boolean) => {
        setLocalPost(prev => ({ ...prev, is_pinned: isPinned }))
    }

    const isPending = localPost.status === 'pending'
    const isRejected = localPost.status === 'rejected'
    const isOwn = localPost.author_id === currentUserId

    return (
        <Card className={cn(
            'border-none shadow-sm',
            localPost.is_pinned && 'ring-2 ring-primary/20',
            isPending && isOwn && 'opacity-80',
            isRejected && isOwn && 'opacity-60'
        )}>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={author.photo_url || undefined} alt={author.full_name} />
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{timeAgo}</span>
                                {localPost.is_pinned && (
                                    <span className="flex items-center gap-1 text-primary">
                                        <Pin className="h-3 w-3" />
                                        Fixado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status badge for own pending/rejected posts */}
                        {isOwn && isPending && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                {POST_STATUS_LABELS.pending}
                            </Badge>
                        )}
                        {isOwn && isRejected && (
                            <Badge variant="outline" className="text-destructive border-destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                {POST_STATUS_LABELS.rejected}
                            </Badge>
                        )}

                        <FeedPostMenu
                            postId={localPost.id}
                            authorId={localPost.author_id}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            isPinned={localPost.is_pinned}
                            onDeleted={onDeleted}
                            onEdit={() => setIsEditing(true)}
                            onPinToggled={handlePinToggled}
                        />
                    </div>
                </div>

                {/* Rejection reason */}
                {isOwn && isRejected && localPost.rejection_reason && (
                    <div className="mb-3 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                        <strong>Motivo da rejeição:</strong> {localPost.rejection_reason}
                    </div>
                )}

                {/* Content */}
                {isEditing ? (
                    <div className="space-y-3 mb-3">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px]"
                            disabled={isSaving}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editContent.trim()}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-3 whitespace-pre-wrap text-foreground">
                        {localPost.content}
                    </div>
                )}

                {/* Media */}
                {localPost.media && localPost.media.length > 0 && (
                    <div className="mb-3">
                        <FeedMediaGallery media={localPost.media} />
                    </div>
                )}

                {/* Actions bar */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <FeedReactions
                        postId={localPost.id}
                        reactions={localPost.reactions}
                        userReaction={localPost.user_reaction || null}
                        currentUserId={currentUserId}
                        allowReactions={settings.allow_reactions}
                        onReactionChange={handleReactionChange}
                    />

                    {settings.allow_comments && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowComments(!showComments)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <MessageCircle className="h-5 w-5 mr-1" />
                            {localPost.comments_count > 0 && (
                                <span>{localPost.comments_count}</span>
                            )}
                        </Button>
                    )}
                </div>

                {/* Comments section */}
                {showComments && settings.allow_comments && (
                    <div className="mt-4 pt-4 border-t">
                        <FeedComments
                            postId={localPost.id}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
