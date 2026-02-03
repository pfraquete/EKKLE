'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'blue' | 'indigo' | 'emerald' | 'red' | 'purple' | 'orange' | 'cyan' | 'amber' | 'gold'
  href?: string
  className?: string
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500/20 via-blue-500/10 to-transparent',
    icon: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    border: 'border-blue-500/20 group-hover:border-blue-500/40',
    accent: 'text-blue-400',
  },
  indigo: {
    bg: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    icon: 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]',
    border: 'border-indigo-500/20 group-hover:border-indigo-500/40',
    accent: 'text-indigo-400',
  },
  emerald: {
    bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    icon: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    border: 'border-emerald-500/20 group-hover:border-emerald-500/40',
    accent: 'text-emerald-400',
  },
  red: {
    bg: 'from-red-500/20 via-red-500/10 to-transparent',
    icon: 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    border: 'border-red-500/20 group-hover:border-red-500/40',
    accent: 'text-red-400',
  },
  purple: {
    bg: 'from-purple-500/20 via-purple-500/10 to-transparent',
    icon: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]',
    border: 'border-purple-500/20 group-hover:border-purple-500/40',
    accent: 'text-purple-400',
  },
  orange: {
    bg: 'from-orange-500/20 via-orange-500/10 to-transparent',
    icon: 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(249,115,22,0.15)]',
    border: 'border-orange-500/20 group-hover:border-orange-500/40',
    accent: 'text-orange-400',
  },
  cyan: {
    bg: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    icon: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]',
    border: 'border-cyan-500/20 group-hover:border-cyan-500/40',
    accent: 'text-cyan-400',
  },
  amber: {
    bg: 'from-amber-500/20 via-amber-500/10 to-transparent',
    icon: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    border: 'border-amber-500/20 group-hover:border-amber-500/40',
    accent: 'text-amber-400',
  },
  gold: {
    bg: 'from-gold/20 via-gold/10 to-transparent',
    icon: 'bg-gold/20 text-gold group-hover:bg-gold/30',
    glow: 'group-hover:shadow-gold-glow',
    border: 'border-gold/20 group-hover:border-gold/40',
    accent: 'text-gold',
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  href,
  className,
}: StatCardProps) {
  const colors = colorVariants[color]
  
  const CardWrapper = href ? 'a' : 'div'
  
  return (
    <CardWrapper
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-2xl border backdrop-blur-xl',
        'bg-gradient-to-br from-black-surface/80 via-black-surface/60 to-black-elevated/40',
        'transition-all duration-500 ease-out',
        colors.border,
        colors.glow,
        href && 'cursor-pointer',
        className
      )}
    >
      {/* Gradient Overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        colors.bg
      )} />
      
      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={cn(
          'absolute inset-[-1px] rounded-2xl bg-gradient-to-r blur-sm',
          colors.bg
        )} />
      </div>
      
      {/* Content */}
      <div className="relative p-6 flex flex-col items-center text-center">
        {/* Icon Container */}
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
          'transition-all duration-300 transform group-hover:scale-110',
          colors.icon
        )}>
          <Icon className="h-7 w-7" />
        </div>
        
        {/* Value */}
        <p className={cn(
          'text-4xl font-black leading-none tracking-tight',
          color === 'gold' ? 'text-gold' : 'text-white-primary',
          'transition-transform duration-300 group-hover:scale-105'
        )}>
          {value}
        </p>
        
        {/* Title */}
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-text-secondary mt-3">
          {title}
        </p>
        
        {/* Subtitle or Trend */}
        {(subtitle || trend) && (
          <div className="mt-2">
            {trend ? (
              <div className={cn(
                'flex items-center gap-1 text-xs font-semibold',
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              )}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            ) : subtitle && (
              <p className={cn('text-xs font-medium', colors.accent)}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  )
}
