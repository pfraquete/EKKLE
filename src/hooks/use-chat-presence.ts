'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { updatePresence } from '@/actions/direct-messages'

interface UseChatPresenceOptions {
    heartbeatMs?: number
}

/**
 * Hook to manage user online presence
 * Sends heartbeat to server and cleans up on unmount
 */
export function useChatPresence({ heartbeatMs = 30000 }: UseChatPresenceOptions = {}) {
    const [isConnected, setIsConnected] = useState(false)
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
    const isOnlineRef = useRef(false)

    const goOnline = useCallback(async () => {
        if (!isOnlineRef.current) {
            isOnlineRef.current = true
            setIsConnected(true)
            await updatePresence(true)
        }
    }, [])

    const goOffline = useCallback(async () => {
        if (isOnlineRef.current) {
            isOnlineRef.current = false
            setIsConnected(false)
            await updatePresence(false)
        }
    }, [])

    useEffect(() => {
        // Go online when component mounts
        goOnline()

        // Set up heartbeat
        heartbeatRef.current = setInterval(async () => {
            if (isOnlineRef.current) {
                await updatePresence(true)
            }
        }, heartbeatMs)

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                goOnline()
            } else {
                goOffline()
            }
        }

        // Handle before unload
        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable offline signal
            if (isOnlineRef.current) {
                // Note: We can't use async here, so we'll rely on the server
                // to detect disconnection via heartbeat timeout
                goOffline()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('beforeunload', handleBeforeUnload)

        // Cleanup
        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current)
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('beforeunload', handleBeforeUnload)
            goOffline()
        }
    }, [goOnline, goOffline, heartbeatMs])

    return { isConnected, goOnline, goOffline }
}
