'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Conversation, getConversations } from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'
import { useIsDesktop } from '@/hooks/use-media-query'
import { ChatList } from './chat-list'
import { MessageSquare } from 'lucide-react'

interface ChatSplitLayoutProps {
    initialConversations: Conversation[]
    currentUserId: string
    basePath: string
    selectedConversationId?: string
    children?: React.ReactNode
}

export function ChatSplitLayout({
    initialConversations,
    currentUserId,
    basePath,
    selectedConversationId,
    children,
}: ChatSplitLayoutProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const isDesktop = useIsDesktop()
    const router = useRouter()
    const pathname = usePathname()

    // Subscribe to realtime updates for conversations
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('dm-split-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                },
                async () => {
                    const updated = await getConversations()
                    setConversations(updated)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Get other participant for displaying in the empty state
    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(p => p.profile_id !== currentUserId)?.profile
    }

    // Mobile: Show only list or conversation
    if (!isDesktop) {
        // If we have a selected conversation (children), show it
        if (selectedConversationId && children) {
            return (
                <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
                    {children}
                </div>
            )
        }

        // Otherwise show the list
        return (
            <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
                <ChatList
                    initialConversations={conversations}
                    currentUserId={currentUserId}
                    basePath={basePath}
                />
            </div>
        )
    }

    // Desktop: Split view
    return (
        <div className="h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[360px_1fr] h-full">
                {/* Left: Conversation List */}
                <div className="border-r border-border/50 overflow-hidden">
                    <ChatListDesktop
                        conversations={conversations}
                        currentUserId={currentUserId}
                        basePath={basePath}
                        selectedConversationId={selectedConversationId}
                    />
                </div>

                {/* Right: Chat Area */}
                <div className="overflow-hidden">
                    {selectedConversationId && children ? (
                        children
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    )
}

// Desktop version of ChatList with selected state
function ChatListDesktop({
    conversations,
    currentUserId,
    basePath,
    selectedConversationId,
}: {
    conversations: Conversation[]
    currentUserId: string
    basePath: string
    selectedConversationId?: string
}) {
    const [showSearch, setShowSearch] = useState(false)
    const router = useRouter()

    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(p => p.profile_id !== currentUserId)?.profile
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <h1 className="font-black text-lg uppercase tracking-tighter">Mensagens</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                        >
                            {showSearch ? (
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2.5 bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Panel */}
            {showSearch && (
                <div className="p-4 border-b border-border/50 bg-muted/30">
                    <ChatList
                        initialConversations={[]}
                        currentUserId={currentUserId}
                        basePath={basePath}
                        showSearchOnly
                        onSearchClose={() => setShowSearch(false)}
                    />
                </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <h3 className="font-bold text-foreground mb-2">Nenhuma conversa</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Comece uma conversa buscando por alguém
                        </p>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                            Iniciar conversa
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {conversations.map((conversation) => {
                            const other = getOtherParticipant(conversation)
                            const hasUnread = (conversation.unread_count || 0) > 0
                            const isSelected = selectedConversationId === conversation.id

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => router.push(`${basePath}/${conversation.id}`)}
                                    className={`w-full flex items-center gap-3 p-4 transition-colors text-left ${
                                        isSelected
                                            ? 'bg-primary/10 border-l-2 border-l-primary'
                                            : 'hover:bg-muted/50'
                                    }`}
                                >
                                    {/* Avatar with online status */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                            {other?.photo_url ? (
                                                <img
                                                    src={other.photo_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        {hasUnread && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-primary-foreground">
                                                    {conversation.unread_count}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className={`font-bold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-foreground/90'}`}>
                                                {other?.full_name || 'Utilizador'}
                                            </p>
                                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                                {formatTimeAgo(conversation.last_message_at)}
                                            </span>
                                        </div>
                                        {other?.nickname && (
                                            <p className="text-xs text-primary font-medium mb-0.5">
                                                @{other.nickname}
                                            </p>
                                        )}
                                        {conversation.last_message_preview && (
                                            <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {conversation.last_message_preview}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// Empty state for when no conversation is selected
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
                Selecione uma conversa
            </h2>
            <p className="text-muted-foreground max-w-sm">
                Escolha uma conversa da lista ao lado ou inicie uma nova conversa buscando por alguém
            </p>
        </div>
    )
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
