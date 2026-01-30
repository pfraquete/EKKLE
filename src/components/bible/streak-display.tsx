'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakDisplayProps {
    streak: number
    longestStreak?: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

export function StreakDisplay({
    streak,
    longestStreak,
    size = 'md',
    showLabel = true,
    className
}: StreakDisplayProps) {
    const sizeClasses = {
        sm: {
            container: 'gap-1',
            icon: 'h-4 w-4',
            number: 'text-lg font-bold',
            label: 'text-xs'
        },
        md: {
            container: 'gap-2',
            icon: 'h-6 w-6',
            number: 'text-2xl font-bold',
            label: 'text-sm'
        },
        lg: {
            container: 'gap-3',
            icon: 'h-8 w-8',
            number: 'text-4xl font-bold',
            label: 'text-base'
        }
    }

    const sizes = sizeClasses[size]
    const isActive = streak > 0

    return (
        <div className={cn('flex items-center', sizes.container, className)}>
            <div className={cn(
                'relative',
                isActive && 'animate-pulse'
            )}>
                <Flame
                    className={cn(
                        sizes.icon,
                        isActive
                            ? 'text-orange-500 fill-orange-400'
                            : 'text-muted-foreground'
                    )}
                />
                {isActive && streak >= 7 && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                )}
            </div>
            <div className="flex flex-col">
                <span className={cn(
                    sizes.number,
                    isActive ? 'text-orange-500' : 'text-muted-foreground'
                )}>
                    {streak}
                </span>
                {showLabel && (
                    <span className={cn(sizes.label, 'text-muted-foreground')}>
                        {streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                    </span>
                )}
            </div>
            {longestStreak !== undefined && longestStreak > streak && (
                <div className="ml-2 pl-2 border-l flex flex-col">
                    <span className={cn(sizes.number, 'text-muted-foreground')}>
                        {longestStreak}
                    </span>
                    {showLabel && (
                        <span className={cn(sizes.label, 'text-muted-foreground')}>
                            recorde
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
