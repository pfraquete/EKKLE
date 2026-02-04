'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeMessage {
    id: string
    church_id: string
    instance_name: string
    direction: 'inbound' | 'outbound'
    from_number: string
    to_number: string
    message_type: string
    content: string
    status: string
    sent_at: string
    created_at: string
}

interface UseRealtimeMessagesProps {
    churchId: string | null
    onNewMessage?: (message: RealtimeMessage) => void
}

export function useRealtimeMessages({ churchId, onNewMessage }: UseRealtimeMessagesProps) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)

    useEffect(() => {
        if (!churchId) return

        const supabase = createClient()
        let channel: RealtimeChannel | null = null

        const setupRealtime = async () => {
            // Subscribe to changes in whatsapp_messages table for this church
            channel = supabase
                .channel(`whatsapp_messages_${churchId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'whatsapp_messages',
                        filter: `church_id=eq.${churchId}`
                    },
                    (payload) => {
                        console.log('[Realtime] New message received:', payload)
                        const newMessage = payload.new as RealtimeMessage
                        setLastMessage(newMessage)
                        onNewMessage?.(newMessage)
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Subscription status:', status)
                    setIsConnected(status === 'SUBSCRIBED')
                })
        }

        setupRealtime()

        // Cleanup on unmount
        return () => {
            if (channel) {
                console.log('[Realtime] Unsubscribing from channel')
                supabase.removeChannel(channel)
            }
        }
    }, [churchId, onNewMessage])

    return { isConnected, lastMessage }
}

export function useRealtimeChats({ churchId, onChatUpdate }: {
    churchId: string | null
    onChatUpdate?: () => void
}) {
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!churchId) return

        const supabase = createClient()
        let channel: RealtimeChannel | null = null

        const setupRealtime = async () => {
            channel = supabase
                .channel(`whatsapp_chats_${churchId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'whatsapp_messages',
                        filter: `church_id=eq.${churchId}`
                    },
                    (payload) => {
                        console.log('[Realtime] Chat update:', payload)
                        onChatUpdate?.()
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Chat subscription status:', status)
                    setIsConnected(status === 'SUBSCRIBED')
                })
        }

        setupRealtime()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [churchId, onChatUpdate])

    return { isConnected }
}
