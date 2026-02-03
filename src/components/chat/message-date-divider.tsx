'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MessageDateDividerProps {
    date: Date
}

export function MessageDateDivider({ date }: MessageDateDividerProps) {
    const formatDate = () => {
        if (isToday(date)) {
            return 'Hoje'
        }
        if (isYesterday(date)) {
            return 'Ontem'
        }
        return format(date, "d 'de' MMMM", { locale: ptBR })
    }

    return (
        <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs font-medium text-muted-foreground bg-background px-2">
                {formatDate()}
            </span>
            <div className="flex-1 h-px bg-border/50" />
        </div>
    )
}

// Helper function to group messages by date
export function groupMessagesByDate<T extends { created_at: string }>(
    messages: T[]
): { date: Date; label: string; messages: T[] }[] {
    const groups: Map<string, T[]> = new Map()

    messages.forEach((message) => {
        const date = new Date(message.created_at)
        const dateKey = format(date, 'yyyy-MM-dd')

        if (!groups.has(dateKey)) {
            groups.set(dateKey, [])
        }
        groups.get(dateKey)!.push(message)
    })

    return Array.from(groups.entries()).map(([dateKey, msgs]) => {
        const date = new Date(dateKey)
        let label: string

        if (isToday(date)) {
            label = 'Hoje'
        } else if (isYesterday(date)) {
            label = 'Ontem'
        } else {
            label = format(date, "d 'de' MMMM", { locale: ptBR })
        }

        return {
            date,
            label,
            messages: msgs,
        }
    })
}
