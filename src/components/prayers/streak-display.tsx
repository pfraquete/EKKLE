'use client'

import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  size?: 'sm' | 'md' | 'lg'
  showLongest?: boolean
  className?: string
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  size = 'md',
  showLongest = true,
  className,
}: StreakDisplayProps) {
  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-4 h-4',
      number: 'text-lg',
      label: 'text-[8px]',
    },
    md: {
      container: 'p-3',
      icon: 'w-6 h-6',
      number: 'text-2xl',
      label: 'text-[10px]',
    },
    lg: {
      container: 'p-4',
      icon: 'w-8 h-8',
      number: 'text-4xl',
      label: 'text-xs',
    },
  }

  const classes = sizeClasses[size]
  const isActive = currentStreak > 0

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Current Streak */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl bg-gradient-to-br transition-all',
          classes.container,
          isActive
            ? 'from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : 'from-muted/50 to-muted/30 border border-border/50'
        )}
      >
        <Flame
          className={cn(
            classes.icon,
            isActive ? 'text-orange-500' : 'text-muted-foreground'
          )}
        />
        <div className="text-center">
          <div
            className={cn(
              'font-black leading-none',
              classes.number,
              isActive ? 'text-orange-500' : 'text-muted-foreground'
            )}
          >
            {currentStreak}
          </div>
          <p
            className={cn(
              'uppercase tracking-widest font-bold',
              classes.label,
              isActive ? 'text-orange-500/70' : 'text-muted-foreground/70'
            )}
          >
            {currentStreak === 1 ? 'Dia' : 'Dias'}
          </p>
        </div>
      </div>

      {/* Longest Streak */}
      {showLongest && longestStreak > currentStreak && (
        <div className="text-center">
          <p className={cn('font-black text-muted-foreground', classes.number)}>
            {longestStreak}
          </p>
          <p
            className={cn(
              'uppercase tracking-widest font-bold text-muted-foreground/70',
              classes.label
            )}
          >
            Recorde
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for cards/lists
export function StreakBadge({
  streak,
  className,
}: {
  streak: number
  className?: string
}) {
  if (streak === 0) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20',
        className
      )}
    >
      <Flame className="w-3 h-3 text-orange-500" />
      <span className="text-xs font-black text-orange-500">{streak}</span>
    </div>
  )
}
