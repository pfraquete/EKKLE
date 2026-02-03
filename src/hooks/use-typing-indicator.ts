'use client'

import { useCallback, useRef, useEffect } from 'react'
import { setTyping } from '@/actions/direct-messages'

interface UseTypingIndicatorOptions {
    conversationId: string
    debounceMs?: number
    timeoutMs?: number
}

/**
 * Hook to manage typing indicator state
 * Debounces the typing signal and automatically clears after timeout
 */
export function useTypingIndicator({
    conversationId,
    debounceMs = 300,
    timeoutMs = 3000,
}: UseTypingIndicatorOptions) {
    const isTypingRef = useRef(false)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup on unmount or conversation change
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            if (timeoutTimerRef.current) {
                clearTimeout(timeoutTimerRef.current)
            }
            // Clear typing status when leaving
            if (isTypingRef.current) {
                setTyping(conversationId, false)
            }
        }
    }, [conversationId])

    const startTyping = useCallback(() => {
        // Clear any existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Debounce the typing signal
        debounceTimerRef.current = setTimeout(async () => {
            if (!isTypingRef.current) {
                isTypingRef.current = true
                await setTyping(conversationId, true)
            }

            // Reset the timeout timer
            if (timeoutTimerRef.current) {
                clearTimeout(timeoutTimerRef.current)
            }

            // Auto-stop typing after timeout
            timeoutTimerRef.current = setTimeout(async () => {
                if (isTypingRef.current) {
                    isTypingRef.current = false
                    await setTyping(conversationId, false)
                }
            }, timeoutMs)
        }, debounceMs)
    }, [conversationId, debounceMs, timeoutMs])

    const stopTyping = useCallback(async () => {
        // Clear all timers
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        if (timeoutTimerRef.current) {
            clearTimeout(timeoutTimerRef.current)
        }

        // Stop typing immediately
        if (isTypingRef.current) {
            isTypingRef.current = false
            await setTyping(conversationId, false)
        }
    }, [conversationId])

    return { startTyping, stopTyping }
}
