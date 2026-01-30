'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Users, CheckCircle, Calendar, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrayerStatsCardProps {
  stats: {
    totalPrayers: number
    totalMinutes: number
    peoplePrayed: number
    answeredPrayers: number
    currentStreak?: number
  }
  period: 'week' | 'month'
  className?: string
}

export function PrayerStatsCard({ stats, period, className }: PrayerStatsCardProps) {
  const periodLabel = period === 'week' ? 'Esta Semana' : 'Este Mes'

  const statItems = [
    {
      label: 'Oracoes',
      value: stats.totalPrayers,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Minutos',
      value: stats.totalMinutes,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pessoas',
      value: stats.peoplePrayed,
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Respondidas',
      value: stats.answeredPrayers,
      icon: CheckCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <Card className={cn('border-none shadow-lg', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          {periodLabel}
          {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              {stats.currentStreak}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={cn(
                  'p-3 rounded-xl',
                  item.bgColor
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('w-4 h-4', item.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <p className={cn('text-2xl font-black', item.color)}>
                  {item.value}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Simple inline stats for compact display
export function PrayerStatsInline({
  prayers,
  minutes,
  people,
  className,
}: {
  prayers: number
  minutes: number
  people: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <span className="flex items-center gap-1 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="font-bold">{prayers}</span> oracoes
      </span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="font-bold">{minutes}</span> min
      </span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <Users className="w-4 h-4" />
        <span className="font-bold">{people}</span> pessoas
      </span>
    </div>
  )
}
