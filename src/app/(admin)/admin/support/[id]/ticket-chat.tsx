'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Lock, User, Bot } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { addTicketMessage, type TicketMessage, type TicketStatus } from '@/actions/super-admin/tickets'

interface TicketChatProps {
    ticketId: string
    initialMessages: TicketMessage[]
    ticketStatus: TicketStatus
}

export function TicketChat({ ticketId, initialMessages, ticketStatus }: TicketChatProps) {
    const router = useRouter()
    const [messages, setMessages] = useState(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isPending) return

        const content = newMessage.trim()
        setNewMessage('')

        startTransition(async () => {
            try {
                const message = await addTicketMessage(ticketId, content, {
                    isInternal
                })
                setMessages(prev => [...prev, message])
                router.refresh()
            } catch (error) {
                console.error('Failed to send message:', error)
                setNewMessage(content)
            }
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const isClosed = ticketStatus === 'closed'

    return (
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        Nenhuma mensagem ainda
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {isClosed ? (
                <div className="p-4 border-t border-zinc-800 bg-zinc-800/50">
                    <p className="text-center text-zinc-500 text-sm">
                        Este ticket esta fechado. Reabra para enviar mensagens.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                    {/* Internal note toggle */}
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setIsInternal(!isInternal)}
                            className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
                                isInternal
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            )}
                        >
                            <Lock className="h-3 w-3" />
                            {isInternal ? 'Nota Interna' : 'Resposta Publica'}
                        </button>
                        {isInternal && (
                            <span className="text-xs text-amber-400/70">
                                Esta mensagem nao sera visivel para o solicitante
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isInternal ? 'Escreva uma nota interna...' : 'Digite sua resposta...'}
                            rows={2}
                            className={cn(
                                'flex-1 px-4 py-3 bg-zinc-800 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 resize-none',
                                isInternal
                                    ? 'border-amber-500/50 focus:ring-amber-500/50'
                                    : 'border-zinc-700 focus:ring-orange-500/50'
                            )}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isPending}
                            className={cn(
                                'px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                isInternal
                                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                                    : 'bg-orange-500 hover:bg-orange-400 text-zinc-900'
                            )}
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

function MessageBubble({ message }: { message: TicketMessage }) {
    const isAdmin = message.sender_type === 'admin'
    const isSystem = message.sender_type === 'system'

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="px-3 py-1.5 rounded-full bg-zinc-800 text-xs text-zinc-400">
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            'flex gap-3',
            isAdmin ? 'flex-row-reverse' : ''
        )}>
            {/* Avatar */}
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isAdmin ? 'bg-orange-500/20' : 'bg-zinc-700'
            )}>
                {message.sender?.avatar_url ? (
                    <img
                        src={message.sender.avatar_url}
                        alt={message.sender.full_name}
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : isAdmin ? (
                    <Bot className="h-4 w-4 text-orange-400" />
                ) : (
                    <User className="h-4 w-4 text-zinc-400" />
                )}
            </div>

            {/* Message */}
            <div className={cn(
                'flex-1 max-w-[70%]',
                isAdmin ? 'text-right' : ''
            )}>
                {/* Header */}
                <div className={cn(
                    'flex items-center gap-2 mb-1',
                    isAdmin ? 'justify-end' : ''
                )}>
                    <span className="text-sm font-medium text-zinc-300">
                        {message.sender?.full_name || message.sender_name || 'Usuario'}
                    </span>
                    {message.is_internal && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            <Lock className="h-3 w-3" />
                            Interno
                        </span>
                    )}
                    <span className="text-xs text-zinc-500">
                        {format(new Date(message.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                </div>

                {/* Content */}
                <div className={cn(
                    'px-4 py-3 rounded-2xl',
                    isAdmin
                        ? message.is_internal
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : 'bg-orange-500/20'
                        : 'bg-zinc-800',
                    isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'
                )}>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                        {message.content}
                    </p>
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, i) => (
                            <a
                                key={i}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                                {attachment.name}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
