'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, User, Search } from 'lucide-react'
import { Conversation, getConversations } from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserSearch } from './user-search'

interface ChatListProps {
    initialConversations: Conversation[]
    currentUserId: string
    basePath: string
}

export function ChatList({ initialConversations, currentUserId, basePath }: ChatListProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const [showSearch, setShowSearch] = useState(false)

    // Subscribe to realtime updates
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('dm-list-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                },
                async () => {
                    // Refresh conversations list when any message changes
                    const updated = await getConversations()
                    setConversations(updated)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Get other participant in 1-on-1 conversation
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
                                <Search className="w-5 h-5 text-muted-foreground" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2.5 bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-primary-foreground" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Panel */}
            {showSearch && (
                <div className="p-4 border-b border-border/50 bg-muted/30">
                    <UserSearch
                        basePath={basePath}
                        onClose={() => setShowSearch(false)}
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

                            return (
                                <Link
                                    key={conversation.id}
                                    href={`${basePath}/${conversation.id}`}
                                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                            {other?.photo_url ? (
                                                <img
                                                    src={other.photo_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-muted-foreground" />
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
                                                {formatDistanceToNow(new Date(conversation.last_message_at), {
                                                    addSuffix: false,
                                                    locale: ptBR,
                                                })}
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
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
