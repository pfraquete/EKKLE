'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
  showValue?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'gold', showValue = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const variantStyles = {
      default: 'bg-white-soft',
      gold: 'bg-gradient-to-r from-gold-dark via-gold to-gold-light',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    }

    const glowStyles = {
      default: '',
      gold: 'shadow-gold-glow',
      success: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      warning: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      danger: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    }

    return (
      <div className="relative">
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            'relative h-2 w-full overflow-hidden rounded-full bg-gray-border',
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'h-full w-full flex-1 transition-all duration-500 ease-out rounded-full',
              variantStyles[variant],
              percentage > 0 && glowStyles[variant]
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </div>
        {showValue && (
          <span className="absolute -top-6 right-0 text-xs font-medium text-gray-text-secondary">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
