'use client'

import { useState } from 'react'
import { Smile } from 'lucide-react'
import { addReaction, removeReaction, Reaction, ReactionType } from '@/actions/direct-messages'

const REACTIONS: { emoji: string; name: ReactionType }[] = [
    { emoji: '👍', name: 'like' },
    { emoji: '❤️', name: 'love' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😢', name: 'sad' },
    { emoji: '😮', name: 'wow' },
    { emoji: '🙏', name: 'pray' },
]

interface ReactionGroup {
    reaction: ReactionType
    emoji: string
    count: number
    users: { id: string; full_name: string }[]
    hasReacted: boolean
}

interface MessageReactionsProps {
    messageId: string
    reactions: Reaction[]
    currentUserId: string
    isOwn?: boolean
}

export function MessageReactions({
    messageId,
    reactions,
    currentUserId,
    isOwn = false,
}: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Group reactions by type
    const groupedReactions: ReactionGroup[] = REACTIONS
        .map((r) => {
            const matchingReactions = reactions.filter((reaction) => reaction.reaction === r.name)
            return {
                reaction: r.name,
                emoji: r.emoji,
                count: matchingReactions.length,
                users: matchingReactions.map((reaction) => ({
                    id: reaction.user_id,
                    full_name: reaction.user?.full_name || 'Usuário',
                })),
                hasReacted: matchingReactions.some((reaction) => reaction.user_id === currentUserId),
            }
        })
        .filter((group) => group.count > 0)

    const handleReaction = async (reactionName: ReactionType) => {
        if (isLoading) return

        setIsLoading(true)
        setShowPicker(false)

        try {
            const existingReaction = groupedReactions.find(
                (g) => g.reaction === reactionName && g.hasReacted
            )

            if (existingReaction) {
                await removeReaction(messageId, reactionName)
            } else {
                await addReaction(messageId, reactionName)
            }
        } catch (error) {
            console.error('Error handling reaction:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {/* Existing reactions */}
            {groupedReactions.length > 0 && (
                <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {groupedReactions.map((group) => (
                        <button
                            key={group.reaction}
                            onClick={() => handleReaction(group.reaction)}
                            disabled={isLoading}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
                                group.hasReacted
                                    ? 'bg-primary/20 border border-primary/30'
                                    : 'bg-muted/50 border border-border/50 hover:bg-muted'
                            } disabled:opacity-50`}
                            title={group.users.map((u) => u.full_name).join(', ')}
                        >
                            <span>{group.emoji}</span>
                            <span className="font-medium">{group.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Add reaction button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all"
                >
                    <Smile className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Reaction picker */}
                {showPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPicker(false)}
                        />
                        <div
                            className={`absolute z-20 bottom-full mb-1 ${
                                isOwn ? 'right-0' : 'left-0'
                            } bg-card border border-border rounded-xl shadow-lg p-1.5 flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-150`}
                        >
                            {REACTIONS.map((r) => {
                                const group = groupedReactions.find(
                                    (g) => g.reaction === r.name
                                )
                                return (
                                    <button
                                        key={r.name}
                                        onClick={() => handleReaction(r.name)}
                                        disabled={isLoading}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-muted transition-colors ${
                                            group?.hasReacted ? 'bg-primary/20' : ''
                                        } disabled:opacity-50`}
                                    >
                                        {r.emoji}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// Compact version for showing reactions only
export function ReactionsDisplay({
    reactions,
    currentUserId,
    isOwn = false,
}: {
    reactions: Reaction[]
    currentUserId: string
    isOwn?: boolean
}) {
    if (reactions.length === 0) return null

    // Group reactions by type
    const groupedReactions = REACTIONS
        .map((r) => {
            const matchingReactions = reactions.filter((reaction) => reaction.reaction === r.name)
            return {
                reaction: r.name,
                emoji: r.emoji,
                count: matchingReactions.length,
                users: matchingReactions.map((reaction) => ({
                    id: reaction.user_id,
                    full_name: reaction.user?.full_name || 'Usuário',
                })),
                hasReacted: matchingReactions.some((reaction) => reaction.user_id === currentUserId),
            }
        })
        .filter((group) => group.count > 0)

    return (
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
            {groupedReactions.map((group) => (
                <span
                    key={group.reaction}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                        group.hasReacted
                            ? 'bg-primary/20 border border-primary/30'
                            : 'bg-muted/50 border border-border/50'
                    }`}
                    title={group.users.map((u) => u.full_name).join(', ')}
                >
                    <span>{group.emoji}</span>
                    <span className="font-medium">{group.count}</span>
                </span>
            ))}
        </div>
    )
}
