'use client'

import { Check, CheckCheck } from 'lucide-react'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

interface ReadReceiptProps {
    status: MessageStatus
    className?: string
}

export function ReadReceipt({ status, className = '' }: ReadReceiptProps) {
    switch (status) {
        case 'sending':
            return (
                <span className={`inline-flex items-center ${className}`}>
                    <svg
                        className="w-3.5 h-3.5 text-muted-foreground/60 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </span>
            )

        case 'sent':
            return (
                <span className={`inline-flex items-center ${className}`}>
                    <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
                </span>
            )

        case 'delivered':
            return (
                <span className={`inline-flex items-center ${className}`}>
                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
                </span>
            )

        case 'read':
            return (
                <span className={`inline-flex items-center ${className}`}>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                </span>
            )

        case 'failed':
            return (
                <span className={`inline-flex items-center ${className}`} title="Falha no envio">
                    <svg
                        className="w-3.5 h-3.5 text-destructive"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </span>
            )

        default:
            return null
    }
}

// Wrapper that determines status from read receipts
export function ReadReceiptFromData({
    isOwn,
    otherUserId,
    readReceipts,
    createdAt,
    className = '',
}: {
    isOwn: boolean
    otherUserId: string
    readReceipts: { userId: string; readAt: string }[]
    createdAt: string
    className?: string
}) {
    if (!isOwn) return null

    // Check if the other user has read this message
    const hasBeenRead = readReceipts.some((r) => r.userId === otherUserId)

    if (hasBeenRead) {
        return <ReadReceipt status="read" className={className} />
    }

    // If message was sent more than a few seconds ago, assume delivered
    const messageAge = Date.now() - new Date(createdAt).getTime()
    if (messageAge > 3000) {
        return <ReadReceipt status="delivered" className={className} />
    }

    return <ReadReceipt status="sent" className={className} />
}
