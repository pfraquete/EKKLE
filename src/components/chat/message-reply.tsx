'use client'

import { X, Reply } from 'lucide-react'
import { DirectMessage } from '@/actions/direct-messages'

interface MessageReplyProps {
    replyTo: DirectMessage | null
    onClear: () => void
}

export function MessageReplyPreview({ replyTo, onClear }: MessageReplyProps) {
    if (!replyTo) return null

    const senderName = replyTo.sender?.full_name || 'Usuário'
    const content = replyTo.content.length > 100
        ? replyTo.content.slice(0, 100) + '...'
        : replyTo.content

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-t border-border/50 animate-in slide-in-from-bottom-2 duration-200">
            <Reply className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
                <p className="text-xs font-bold text-primary truncate">
                    {senderName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {content}
                </p>
            </div>
            <button
                onClick={onClear}
                className="p-1 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    )
}

// Display for replied message inside the chat bubble
interface ReplyReferenceProps {
    replyTo: {
        id: string
        content: string
        sender_id: string | null
        sender?: {
            id: string
            full_name: string
        }
    }
    isOwn: boolean
    onClick?: () => void
}

export function ReplyReference({ replyTo, isOwn, onClick }: ReplyReferenceProps) {
    const senderName = replyTo.sender?.full_name || 'Usuário'
    const content = replyTo.content.length > 60
        ? replyTo.content.slice(0, 60) + '...'
        : replyTo.content

    return (
        <button
            onClick={onClick}
            className={`w-full text-left mb-2 p-2 rounded-lg border-l-2 ${
                isOwn
                    ? 'bg-primary-foreground/10 border-primary-foreground/50'
                    : 'bg-background/50 border-primary'
            } transition-colors hover:opacity-80`}
        >
            <p className={`text-xs font-bold truncate ${
                isOwn ? 'text-primary-foreground/80' : 'text-primary'
            }`}>
                {senderName}
            </p>
            <p className={`text-xs truncate ${
                isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
            }`}>
                {content}
            </p>
        </button>
    )
}
