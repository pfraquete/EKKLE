'use client'

import { useState, useEffect } from 'react'
import { getUserPresence } from '@/actions/direct-messages'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OnlineStatusProps {
    userId: string
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function OnlineStatus({
    userId,
    showLabel = false,
    size = 'md',
    className = '',
}: OnlineStatusProps) {
    const [isOnline, setIsOnline] = useState(false)
    const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)

    // Size classes
    const sizeClasses = {
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    }

    // Fetch initial presence and subscribe to changes
    useEffect(() => {
        const fetchPresence = async () => {
            const presence = await getUserPresence(userId)
            if (presence) {
                setIsOnline(presence.isOnline)
                setLastSeenAt(presence.lastSeenAt)
            }
        }

        fetchPresence()

        // Subscribe to presence changes
        const supabase = createClient()
        const channel = supabase
            .channel(`presence-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    const newData = payload.new as { is_online?: boolean; last_seen_at?: string }
                    if (typeof newData.is_online === 'boolean') {
                        setIsOnline(newData.is_online)
                    }
                    if (newData.last_seen_at) {
                        setLastSeenAt(newData.last_seen_at)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    // Format last seen
    const formatLastSeen = () => {
        if (isOnline) return 'Online'
        if (!lastSeenAt) return 'Offline'

        try {
            return `Visto ${formatDistanceToNow(new Date(lastSeenAt), {
                addSuffix: true,
                locale: ptBR,
            })}`
        } catch {
            return 'Offline'
        }
    }

    if (!showLabel) {
        return (
            <span
                className={`inline-block rounded-full ${sizeClasses[size]} ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                } ${className}`}
                title={formatLastSeen()}
            />
        )
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <span
                className={`inline-block rounded-full ${sizeClasses[size]} ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
            />
            <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formatLastSeen()}
            </span>
        </div>
    )
}

// Static version without realtime for performance
export function OnlineStatusStatic({
    isOnline,
    lastSeenAt,
    showLabel = false,
    size = 'md',
    className = '',
}: {
    isOnline: boolean
    lastSeenAt?: string | null
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}) {
    const sizeClasses = {
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    }

    const formatLastSeen = () => {
        if (isOnline) return 'Online'
        if (!lastSeenAt) return 'Offline'

        try {
            return `Visto ${formatDistanceToNow(new Date(lastSeenAt), {
                addSuffix: true,
                locale: ptBR,
            })}`
        } catch {
            return 'Offline'
        }
    }

    if (!showLabel) {
        return (
            <span
                className={`inline-block rounded-full ${sizeClasses[size]} ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                } ${className}`}
                title={formatLastSeen()}
            />
        )
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <span
                className={`inline-block rounded-full ${sizeClasses[size]} ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
            />
            <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formatLastSeen()}
            </span>
        </div>
    )
}
