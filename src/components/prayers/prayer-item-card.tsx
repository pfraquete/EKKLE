'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Heart,
  BookOpen,
  Sparkles,
  Users,
  Check,
  Loader2,
} from 'lucide-react'
import { markPrayerItemAnswered } from '@/actions/prayers'
import type { PrayerItem } from '@/actions/prayers'

interface PrayerItemCardProps {
  item: PrayerItem
  onAnswered?: () => void
}

const typeConfig = {
  MOTIVO: {
    icon: Heart,
    label: 'Motivo de Oracao',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  PROMESSA: {
    icon: BookOpen,
    label: 'Promessa',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  TRANSFORMACAO: {
    icon: Sparkles,
    label: 'Transformacao',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  PESSOA: {
    icon: Users,
    label: 'Pessoa Intercedida',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
}

export function PrayerItemCard({ item, onAnswered }: PrayerItemCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = typeConfig[item.item_type]
  const Icon = config.icon

  const handleMarkAnswered = async () => {
    setIsSubmitting(true)
    try {
      const result = await markPrayerItemAnswered(item.id, notes || undefined)
      if (result.success) {
        setIsDialogOpen(false)
        onAnswered?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card
        className={cn(
          'border transition-all',
          config.borderColor,
          item.is_answered && 'opacity-60'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn('p-2 rounded-xl', config.bgColor)}>
              <Icon className={cn('w-4 h-4', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest',
                    config.color
                  )}
                >
                  {config.label}
                </span>
                {item.is_answered && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">
                    <Check className="w-3 h-3" />
                    Respondida
                  </span>
                )}
              </div>

              {item.item_type === 'PESSOA' && item.person_name && (
                <p className="font-bold text-foreground mb-1">
                  {item.person_name}
                </p>
              )}

              <p className="text-sm text-muted-foreground">{item.content}</p>

              {item.item_type === 'PROMESSA' && item.verse_reference && (
                <p className="text-xs text-primary mt-1 font-medium">
                  {item.verse_reference}
                </p>
              )}

              {item.is_answered && item.answered_notes && (
                <div className="mt-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <p className="text-xs text-emerald-600">{item.answered_notes}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.answered_at &&
                      new Date(item.answered_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Action */}
            {!item.is_answered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="text-muted-foreground hover:text-emerald-500"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark as Answered Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Respondida</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className={cn('p-3 rounded-lg', config.bgColor)}>
              <p className="text-sm font-medium">{item.content}</p>
              {item.person_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.person_name}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Testemunho (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conte como Deus respondeu essa oracao..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAnswered}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
