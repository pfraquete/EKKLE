'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    MessageSquare,
    Send,
    Trash2,
    Pin,
    CheckCircle2,
    MoreVertical,
    CornerDownRight,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    getLessonComments,
    postComment,
    deleteComment,
    togglePinComment,
    toggleAnsweredComment,
    type CourseComment
} from '@/actions/course-comments'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
    videoId: string
    userId: string
    userRole: string
}

export function CommentSection({ videoId, userId, userRole }: CommentSectionProps) {
    const [comments, setComments] = useState<CourseComment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const isPastor = userRole === 'PASTOR'

    const loadComments = useCallback(async () => {
        setLoading(true)
        const data = await getLessonComments(videoId)
        setComments(data)
        setLoading(false)
    }, [videoId])

    useEffect(() => {
        loadComments()
    }, [loadComments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || submitting) return

        setSubmitting(true)
        const result = await postComment(videoId, newComment, replyTo || undefined)

        if (result.success) {
            setNewComment('')
            setReplyTo(null)
            await loadComments()
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este comentário?')) return
        const result = await deleteComment(id)
        if (result.success) await loadComments()
    }

    const handleTogglePin = async (id: string, current: boolean) => {
        const result = await togglePinComment(id, !current)
        if (result.success) await loadComments()
    }

    const handleToggleAnswered = async (id: string, current: boolean) => {
        const result = await toggleAnsweredComment(id, !current)
        if (result.success) await loadComments()
    }

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parent_id)
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Dúvidas e Comentários ({comments.length})
                </h3>
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleSubmit} className="space-y-3">
                {replyTo && (
                    <div className="flex items-center justify-between bg-primary/5 px-3 py-1.5 rounded-md text-xs font-medium text-primary">
                        <span>Respondendo a um comentário</span>
                        <button type="button" onClick={() => setReplyTo(null)} className="hover:underline">Cancelar</button>
                    </div>
                )}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escreva sua dúvida ou comentário..."
                            className="w-full p-4 text-sm border rounded-xl resize-none focus:ring-2 focus:ring-primary/20 outline-none h-24 transition-all"
                        />
                    </div>
                    <Button
                        disabled={submitting || !newComment.trim()}
                        className="h-24 px-6 flex-col gap-2 rounded-xl"
                    >
                        {submitting ? <Send className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
                        <span className="text-xs">Enviar</span>
                    </Button>
                </div>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="py-10 text-center text-muted-foreground animate-pulse">Carregando comentários...</div>
                ) : rootComments.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground bg-gray-50 rounded-2xl border border-dashed">
                        Nenhum comentário ainda. Seja o primeiro a perguntar!
                    </div>
                ) : (
                    rootComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            userId={userId}
                            isPastor={isPastor}
                            onReply={setReplyTo}
                            onDelete={handleDelete}
                            onPin={handleTogglePin}
                            onAnswered={handleToggleAnswered}
                            replies={getReplies(comment.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function CommentItem({
    comment,
    userId,
    isPastor,
    onReply,
    onDelete,
    onPin,
    onAnswered,
    replies = []
}: {
    comment: CourseComment,
    userId: string,
    isPastor: boolean,
    onReply: (id: string) => void,
    onDelete: (id: string) => void,
    onPin: (id: string, cur: boolean) => void,
    onAnswered: (id: string, cur: boolean) => void,
    replies?: CourseComment[]
}) {
    const isAuthor = comment.profile_id === userId
    const canDelete = isAuthor || isPastor

    return (
        <div className={cn(
            "space-y-4 group",
            comment.is_pinned && "bg-primary/5 p-4 rounded-2xl border border-primary/10"
        )}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {comment.profiles?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={comment.profiles.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-6 h-6 text-primary" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                                {comment.profiles?.full_name}
                                {comment.profiles?.role === 'PASTOR' && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded uppercase font-bold tracking-wider">Pastor</span>}
                            </span>
                            <span className="text-[10px] text-muted-foreground">• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}</span>
                            {comment.is_pinned && <span className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded"><Pin className="w-3 h-3" /> Fixado</span>}
                            {comment.is_answered && <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded"><CheckCircle2 className="w-3 h-3" /> Respondido</span>}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isPastor && (
                                <>
                                    <button onClick={() => onPin(comment.id, comment.is_pinned)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-primary transition-colors">
                                        <Pin className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onAnswered(comment.id, comment.is_answered)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-green-600 transition-colors">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {canDelete && (
                                <button onClick={() => onDelete(comment.id)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                    </p>

                    <div className="pt-2 flex items-center gap-4">
                        <button
                            onClick={() => onReply(comment.id)}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                            Responder
                        </button>
                    </div>
                </div>
            </div>

            {/* Replies */}
            {replies.length > 0 && (
                <div className="ml-10 space-y-4 border-l-2 border-primary/10 pl-4 py-2 mt-4">
                    {replies.map(reply => (
                        <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {reply.profiles?.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={reply.profiles.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs">{reply.profiles?.full_name}</span>
                                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}</span>
                                    </div>
                                    {(reply.profile_id === userId || isPastor) && (
                                        <button onClick={() => onDelete(reply.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {reply.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
