'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { createComment } from '@/actions/feed'
import { FeedPostComment } from '@/types/feed'
import { useToast } from '@/hooks/use-toast'

interface FeedCommentFormProps {
    postId: string
    parentId?: string
    placeholder?: string
    onCommentCreated?: (comment: FeedPostComment) => void
    onCancel?: () => void
}

export function FeedCommentForm({
    postId,
    parentId,
    placeholder = 'Escreva um comentário...',
    onCommentCreated,
    onCancel,
}: FeedCommentFormProps) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)

        try {
            const result = await createComment(postId, content, parentId)

            if (result.success && result.comment) {
                setContent('')
                onCommentCreated?.(result.comment)
            } else {
                toast({
                    title: 'Erro',
                    description: result.error || 'Falha ao comentar',
                    variant: 'destructive',
                })
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao comentar',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
        if (e.key === 'Escape' && onCancel) {
            onCancel()
        }
    }

    return (
        <div className="flex gap-2">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[40px] max-h-[120px] py-2 resize-none"
                disabled={isSubmitting}
            />
            <div className="flex flex-col gap-1">
                <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    className="h-10 w-10 shrink-0"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
                {onCancel && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="h-8 w-10 shrink-0 text-muted-foreground"
                    >
                        &times;
                    </Button>
                )}
            </div>
        </div>
    )
}
