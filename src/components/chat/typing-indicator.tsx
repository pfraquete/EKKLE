'use client'

import { useState, useEffect } from 'react'
import { getTypingUsers } from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'

interface TypingIndicatorProps {
    conversationId: string
    currentUserId: string
}

interface TypingUser {
    id: string
    name: string
}

export function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

    useEffect(() => {
        // Fetch initial typing users
        const fetchTyping = async () => {
            const users = await getTypingUsers(conversationId)
            setTypingUsers(users.filter(u => u.id !== currentUserId))
        }

        fetchTyping()

        // Subscribe to typing changes
        const supabase = createClient()
        const channel = supabase
            .channel(`typing-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'typing_indicators',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async () => {
                    // Refetch typing users on any change
                    const users = await getTypingUsers(conversationId)
                    setTypingUsers(users.filter(u => u.id !== currentUserId))
                }
            )
            .subscribe()

        // Cleanup old indicators periodically
        const cleanupInterval = setInterval(async () => {
            const users = await getTypingUsers(conversationId)
            setTypingUsers(users.filter(u => u.id !== currentUserId))
        }, 3000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(cleanupInterval)
        }
    }, [conversationId, currentUserId])

    if (typingUsers.length === 0) {
        return null
    }

    const formatTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].name} está digitando`
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0].name} e ${typingUsers[1].name} estão digitando`
        }
        return `${typingUsers[0].name} e outros estão digitando`
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
            <TypingDots />
            <span>{formatTypingText()}</span>
        </div>
    )
}

// Animated dots component
function TypingDots() {
    return (
        <div className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
    )
}

// Standalone dots for inline use
export function TypingDotsInline({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
    )
}
