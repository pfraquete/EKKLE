'use client'

import { useEffect, useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
    getLessonChatMessages,
    sendLessonChatMessage,
    deleteLessonChatMessage
} from '@/actions/course-live-lessons'
import { Send, Trash2, Users, Loader2, Pin } from 'lucide-react'

interface ChatMessage {
    id: string
    profile_id: string
    message: string
    is_deleted: boolean
    is_pinned: boolean
    created_at: string
    profile?: {
        full_name: string
        photo_url?: string
    }
}

interface LiveLessonChatProps {
    lessonId: string
    profileId?: string
    profileName?: string
    profilePhoto?: string
    isTeacher: boolean
}

export function LiveLessonChat({
    lessonId,
    profileId,
    profileName,
    profilePhoto,
    isTeacher
}: LiveLessonChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Load initial messages
    useEffect(() => {
        const loadMessages = async () => {
            const messages = await getLessonChatMessages(lessonId)
            setMessages(messages as ChatMessage[])
            setLoading(false)
        }

        loadMessages()
    }, [lessonId])

    // Subscribe to realtime messages
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`chat:${lessonId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'course_live_chat',
                    filter: `lesson_id=eq.${lessonId}`
                },
                async (payload) => {
                    // Fetch the full message with profile info
                    const { data } = await supabase
                        .from('course_live_chat')
                        .select('*, profile:profiles(full_name, photo_url)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setMessages(prev => [...prev, data as ChatMessage])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'course_live_chat',
                    filter: `lesson_id=eq.${lessonId}`
                },
                (payload) => {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === payload.new.id
                                ? { ...msg, ...payload.new }
                                : msg
                        )
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [lessonId])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()

        if (!newMessage.trim() || !profileId) return

        const messageText = newMessage.trim()
        setNewMessage('')

        startTransition(async () => {
            await sendLessonChatMessage(lessonId, messageText)
        })
    }

    const handleDeleteMessage = (messageId: string) => {
        startTransition(async () => {
            await deleteLessonChatMessage(messageId)
        })
    }

    const pinnedMessages = messages.filter(m => m.is_pinned && !m.is_deleted)
    const regularMessages = messages.filter(m => !m.is_deleted)

    if (loading) {
        return (
            <div className="bg-card border border-border/50 rounded-2xl h-96 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="bg-card border border-border/50 rounded-2xl flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-bold text-foreground">Chat ao Vivo</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {messages.length} mensagens
                </span>
            </div>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
                <div className="px-3 py-2 bg-primary/5 border-b border-border/50">
                    {pinnedMessages.map(msg => (
                        <div
                            key={msg.id}
                            className="flex items-start gap-2 text-sm"
                        >
                            <Pin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-primary">
                                    {msg.profile?.full_name || 'Anônimo'}:
                                </span>
                                <span className="text-foreground ml-1">{msg.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-3"
            >
                {regularMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-2 group ${
                            msg.profile_id === profileId ? 'flex-row-reverse' : ''
                        }`}
                    >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted/30 flex-shrink-0">
                            {msg.profile?.photo_url ? (
                                <Image
                                    src={msg.profile.photo_url}
                                    alt={msg.profile.full_name || ''}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                                    {(msg.profile?.full_name || 'A')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div
                            className={`flex-1 max-w-[80%] ${
                                msg.profile_id === profileId ? 'text-right' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-muted-foreground">
                                    {msg.profile?.full_name || 'Anônimo'}
                                </span>
                                {isTeacher && msg.profile_id !== profileId && (
                                    <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                                        title="Deletar mensagem"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div
                                className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                                    msg.profile_id === profileId
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                        : 'bg-muted/50 text-foreground rounded-tl-sm'
                                }`}
                            >
                                {msg.message}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 h-10 px-4 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={!profileId || isPending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !profileId || isPending}
                        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
