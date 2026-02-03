'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { toggleReaction } from '@/actions/feed'
import { FeedPostReaction, ReactionType, REACTION_EMOJIS, groupReactions } from '@/types/feed'
import { cn } from '@/lib/utils'
import { SmilePlus } from 'lucide-react'

interface FeedReactionsProps {
    postId: string
    reactions: FeedPostReaction[]
    userReaction: ReactionType | null
    currentUserId: string
    allowReactions: boolean
    onReactionChange?: (newReaction: ReactionType | null) => void
}

export function FeedReactions({
    postId,
    reactions,
    userReaction,
    currentUserId,
    allowReactions,
    onReactionChange,
}: FeedReactionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [localUserReaction, setLocalUserReaction] = useState(userReaction)
    const [localReactions, setLocalReactions] = useState(reactions)

    const reactionGroups = groupReactions(localReactions, currentUserId)
    const totalReactions = localReactions.length

    const handleReaction = async (reaction: ReactionType) => {
        if (!allowReactions || isLoading) return

        setIsLoading(true)
        setIsOpen(false)

        // Optimistic update
        const previousReaction = localUserReaction
        const previousReactions = [...localReactions]

        if (previousReaction === reaction) {
            // Removing reaction
            setLocalUserReaction(null)
            setLocalReactions(prev => prev.filter(r => !(r.user_id === currentUserId && r.reaction === reaction)))
        } else {
            // Adding/changing reaction
            setLocalUserReaction(reaction)
            // Remove old reaction if exists
            const filtered = localReactions.filter(r => r.user_id !== currentUserId)
            // Add new reaction
            filtered.push({
                id: 'temp-' + Date.now(),
                church_id: '',
                post_id: postId,
                user_id: currentUserId,
                reaction,
                created_at: new Date().toISOString(),
            })
            setLocalReactions(filtered)
        }

        try {
            const result = await toggleReaction(postId, reaction)

            if (!result.success) {
                // Revert on error
                setLocalUserReaction(previousReaction)
                setLocalReactions(previousReactions)
            } else {
                // Notify parent
                onReactionChange?.(result.newReaction as ReactionType | null)
            }
        } catch {
            // Revert on error
            setLocalUserReaction(previousReaction)
            setLocalReactions(previousReactions)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Reaction buttons (existing reactions) */}
            {reactionGroups.map(group => (
                <button
                    key={group.reaction}
                    onClick={() => handleReaction(group.reaction)}
                    disabled={!allowReactions || isLoading}
                    className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-sm transition',
                        'hover:bg-muted',
                        group.hasReacted && 'bg-primary/10 text-primary',
                        !allowReactions && 'cursor-default'
                    )}
                    title={group.users.map(u => u.full_name).join(', ')}
                >
                    <span>{group.emoji}</span>
                    <span className="font-medium">{group.count}</span>
                </button>
            ))}

            {/* Add reaction button */}
            {allowReactions && (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            disabled={isLoading}
                        >
                            <SmilePlus className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex gap-1">
                            {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map(reaction => (
                                <button
                                    key={reaction}
                                    onClick={() => handleReaction(reaction)}
                                    className={cn(
                                        'text-2xl p-2 rounded-lg hover:bg-muted transition hover:scale-110',
                                        localUserReaction === reaction && 'bg-primary/10'
                                    )}
                                >
                                    {REACTION_EMOJIS[reaction]}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* Total count if no visible reactions */}
            {reactionGroups.length === 0 && totalReactions > 0 && (
                <span className="text-sm text-muted-foreground">
                    {totalReactions} {totalReactions === 1 ? 'reação' : 'reações'}
                </span>
            )}
        </div>
    )
}
