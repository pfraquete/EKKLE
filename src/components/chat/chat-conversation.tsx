'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, User, MoreVertical, Bell, BellOff } from 'lucide-react'
import Link from 'next/link'
import {
    Conversation,
    DirectMessage,
    getMessages,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    toggleMuteConversation,
} from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'

interface ChatConversationProps {
    conversation: Conversation
    initialMessages: DirectMessage[]
    currentUserId: string
    basePath: string
}

export function ChatConversation({
    conversation,
    initialMessages,
    currentUserId,
    basePath,
}: ChatConversationProps) {
    const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)
    const [showMenu, setShowMenu] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Get other participant
    const otherParticipant = conversation.participants.find(
        p => p.profile_id !== currentUserId
    )?.profile

    // Get my participation record
    const myParticipation = conversation.participants.find(
        p => p.profile_id === currentUserId
    )

    // Mark as read on mount and when new messages arrive
    useEffect(() => {
        markConversationAsRead(conversation.id)
    }, [conversation.id, messages.length])

    // Subscribe to realtime updates
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`dm-${conversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversation.id}`,
                },
                async (payload) => {
                    // Fetch the full message with sender info
                    const { data } = await supabase
                        .from('direct_messages')
                        .select(`
                            *,
                            sender:profiles!direct_messages_sender_id_fkey(
                                id,
                                full_name,
                                nickname,
                                photo_url
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setMessages((prev) => [...prev, data as DirectMessage])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversation.id}`,
                },
                (payload) => {
                    // Handle soft delete
                    if (payload.new.is_deleted) {
                        setMessages((prev) => prev.filter(m => m.id !== payload.new.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversation.id])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
            if (isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }, [messages])

    // Scroll to bottom on initial load
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView()
    }, [])

    const handleSend = useCallback(async (content: string) => {
        const newMessage = await sendMessage(conversation.id, content)
        if (newMessage) {
            // Message will be added via realtime subscription
        }
    }, [conversation.id])

    const handleDelete = useCallback(async (messageId: string) => {
        const success = await deleteMessage(messageId)
        if (success) {
            setMessages((prev) => prev.filter(m => m.id !== messageId))
        }
    }, [])

    const handleToggleMute = useCallback(async () => {
        const newMuted = !myParticipation?.is_muted
        await toggleMuteConversation(conversation.id, newMuted)
        setShowMenu(false)
    }, [conversation.id, myParticipation?.is_muted])

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background">
                <Link
                    href={basePath}
                    className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {otherParticipant?.photo_url ? (
                        <img
                            src={otherParticipant.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                        {otherParticipant?.full_name || 'Utilizador'}
                    </p>
                    {otherParticipant?.nickname && (
                        <p className="text-xs text-primary">
                            @{otherParticipant.nickname}
                        </p>
                    )}
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
                                <button
                                    onClick={handleToggleMute}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                    {myParticipation?.is_muted ? (
                                        <>
                                            <Bell className="w-4 h-4" />
                                            Ativar notificações
                                        </>
                                    ) : (
                                        <>
                                            <BellOff className="w-4 h-4" />
                                            Silenciar
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            {otherParticipant?.photo_url ? (
                                <img
                                    src={otherParticipant.photo_url}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <p className="font-bold text-foreground mb-1">
                            {otherParticipant?.full_name}
                        </p>
                        {otherParticipant?.nickname && (
                            <p className="text-sm text-primary mb-3">
                                @{otherParticipant.nickname}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Envie uma mensagem para iniciar a conversa
                        </p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isOwn={message.sender_id === currentUserId}
                            onDelete={message.sender_id === currentUserId ? handleDelete : undefined}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} />
        </div>
    )
}
