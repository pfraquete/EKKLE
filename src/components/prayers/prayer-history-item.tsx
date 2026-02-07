'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type { Prayer } from '@/actions/prayers'

interface PrayerHistoryItemProps {
  prayer: Prayer
  href: string
}

export function PrayerHistoryItem({ prayer, href }: PrayerHistoryItemProps) {
  const statusConfig = {
    PENDING: {
      icon: Clock,
      label: 'Aguardando',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      animate: false,
    },
    PROCESSING: {
      icon: Loader2,
      label: 'Transcrevendo',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      animate: true,
    },
    COMPLETED: {
      icon: CheckCircle,
      label: 'Concluído',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      animate: false,
    },
    FAILED: {
      icon: AlertCircle,
      label: 'Erro',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      animate: false,
    },
  }

  const status = statusConfig[prayer.transcription_status]
  const StatusIcon = status.icon

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <Link href={href}>
      <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className={cn('p-3 rounded-xl', status.bgColor)}>
              <StatusIcon
                className={cn(
                  'w-5 h-5',
                  status.color,
                  status.animate && 'animate-spin'
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-muted-foreground">
                  {formatDate(prayer.created_at)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(prayer.audio_duration_seconds)}
                </span>
              </div>

              {prayer.ai_summary ? (
                <p className="text-sm text-foreground line-clamp-2">
                  {prayer.ai_summary}
                </p>
              ) : prayer.transcription ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {prayer.transcription.substring(0, 150)}...
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {prayer.transcription_status === 'PROCESSING'
                    ? 'Transcrição em andamento...'
                    : prayer.transcription_status === 'FAILED'
                    ? 'Erro na transcrição'
                    : 'Aguardando processamento'}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {prayer.blessing_received && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Bênção Recebida
                  </Badge>
                )}
                {prayer.session_type === 'GROUP' && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-xs"
                  >
                    Em Grupo
                  </Badge>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
