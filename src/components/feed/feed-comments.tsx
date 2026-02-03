'use client'

import { useState, useEffect } from 'react'
import { FeedPostComment } from '@/types/feed'
import { FeedCommentForm } from './feed-comment-form'
import { FeedCommentItem } from './feed-comment-item'
import { getPostComments } from '@/actions/feed'
import { Loader2 } from 'lucide-react'

interface FeedCommentsProps {
    postId: string
    currentUserId: string
    currentUserRole: string
}

export function FeedComments({
    postId,
    currentUserId,
    currentUserRole,
}: FeedCommentsProps) {
    const [comments, setComments] = useState<FeedPostComment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadComments()
    }, [postId])

    const loadComments = async () => {
        setIsLoading(true)
        try {
            const data = await getPostComments(postId)
            setComments(data)
        } catch (error) {
            console.error('Error loading comments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCommentCreated = (newComment: FeedPostComment) => {
        if (newComment.parent_id) {
            // It's a reply - add to the parent's replies
            setComments(prev => prev.map(comment => {
                if (comment.id === newComment.parent_id) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment],
                    }
                }
                return comment
            }))
        } else {
            // It's a top-level comment
            setComments(prev => [...prev, { ...newComment, replies: [] }])
        }
    }

    const handleCommentDeleted = (commentId: string) => {
        setComments(prev => {
            // First try to remove from top level
            const filtered = prev.filter(c => c.id !== commentId)
            if (filtered.length !== prev.length) {
                return filtered
            }

            // Otherwise remove from replies
            return prev.map(comment => ({
                ...comment,
                replies: comment.replies?.filter(r => r.id !== commentId) || [],
            }))
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Comment form */}
            <FeedCommentForm
                postId={postId}
                onCommentCreated={handleCommentCreated}
            />

            {/* Comments list */}
            {comments.length > 0 && (
                <div className="space-y-2">
                    {comments.map(comment => (
                        <FeedCommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onDeleted={handleCommentDeleted}
                            onReplyCreated={handleCommentCreated}
                        />
                    ))}
                </div>
            )}

            {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    Seja o primeiro a comentar
                </p>
            )}
        </div>
    )
}
