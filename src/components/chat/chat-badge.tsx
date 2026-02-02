'use client'

import { useState, useEffect } from 'react'
import { getUnreadCount } from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'

interface ChatBadgeProps {
    initialCount?: number
}

export function ChatBadge({ initialCount = 0 }: ChatBadgeProps) {
    const [count, setCount] = useState(initialCount)

    // Subscribe to realtime updates for new messages
    useEffect(() => {
        const supabase = createClient()

        // Initial fetch
        const fetchCount = async () => {
            const newCount = await getUnreadCount()
            setCount(newCount)
        }

        fetchCount()

        // Subscribe to changes
        const channel = supabase
            .channel('dm-badge-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                },
                () => {
                    fetchCount()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversation_participants',
                },
                () => {
                    fetchCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (count === 0) return null

    return (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">
                {count > 99 ? '99+' : count}
            </span>
        </span>
    )
}

// Static badge for server-side rendering
export function ChatBadgeStatic({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">
                {count > 99 ? '99+' : count}
            </span>
        </span>
    )
}
