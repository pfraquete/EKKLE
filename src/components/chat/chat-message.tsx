'use client'

import { DirectMessage } from '@/actions/direct-messages'
import { User, MoreVertical, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

interface ChatMessageProps {
    message: DirectMessage
    isOwn: boolean
    onDelete?: (messageId: string) => void
}

export function ChatMessage({ message, isOwn, onDelete }: ChatMessageProps) {
    const [showMenu, setShowMenu] = useState(false)

    const handleDelete = () => {
        onDelete?.(message.id)
        setShowMenu(false)
    }

    return (
        <div
            className={`group flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                    isOwn ? 'bg-primary' : 'bg-muted'
                }`}
            >
                {message.sender?.photo_url ? (
                    <img
                        src={message.sender.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className={`w-4 h-4 ${isOwn ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                )}
            </div>

            {/* Message Bubble */}
            <div className={`flex-1 max-w-[75%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
                <div
                    className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                    }`}
                >
                    {/* Sender Name (only for others) */}
                    {!isOwn && message.sender && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs">
                                {message.sender.full_name}
                            </span>
                            {message.sender.nickname && (
                                <span className="text-xs text-primary/80">
                                    @{message.sender.nickname}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message Content */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </p>

                    {/* Timestamp */}
                    <span
                        className={`text-[10px] mt-1 block ${
                            isOwn
                                ? 'text-primary-foreground/60 text-right'
                                : 'text-muted-foreground/60'
                        }`}
                    >
                        {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                        })}
                    </span>
                </div>
            </div>

            {/* Actions Menu (only for own messages) */}
            {isOwn && onDelete && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-20 min-w-[120px]">
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Apagar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
