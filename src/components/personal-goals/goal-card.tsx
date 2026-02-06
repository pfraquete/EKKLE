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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Check,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  Calendar,
  Sparkles,
  Heart,
  Briefcase,
  Wallet,
  HeartPulse,
  Church,
  GraduationCap,
  Target,
  BookOpen,
} from 'lucide-react'
import {
  markGoalCompleted,
  reopenGoal,
  deletePersonalGoal,
  type PersonalGoal,
  type GoalCategory,
  categoryConfig,
  priorityConfig,
} from '@/actions/personal-goals'

interface GoalCardProps {
  goal: PersonalGoal
  onUpdate?: () => void
  onEdit?: (goal: PersonalGoal) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Heart,
  Briefcase,
  Wallet,
  HeartPulse,
  Church,
  GraduationCap,
  Target,
}

export function GoalCard({ goal, onUpdate, onEdit }: GoalCardProps) {
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const config = categoryConfig[goal.category]
  const priority = priorityConfig[goal.priority]
  const Icon = iconMap[config.icon] || Target

  const handleMarkCompleted = async () => {
    setIsSubmitting(true)
    try {
      const result = await markGoalCompleted(goal.id, notes || undefined)
      if (result.success) {
        setIsCompleteDialogOpen(false)
        setNotes('')
        onUpdate?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReopen = async () => {
    setIsSubmitting(true)
    try {
      const result = await reopenGoal(goal.id)
      if (result.success) {
        onUpdate?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este alvo?')) return
    
    setIsDeleting(true)
    try {
      const result = await deletePersonalGoal(goal.id)
      if (result.success) {
        onUpdate?.()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const isOverdue = goal.target_date && !goal.is_completed && new Date(goal.target_date) < new Date()

  return (
    <>
      <Card
        className={cn(
          'border transition-all hover:shadow-md',
          goal.is_completed && 'opacity-60 bg-muted/30',
          isOverdue && !goal.is_completed && 'border-red-500/50'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn('p-2.5 rounded-xl shrink-0', config.bgColor)}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest',
                    config.color
                  )}
                >
                  {config.label}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    priority.bgColor,
                    priority.color
                  )}
                >
                  {priority.label}
                </span>
                {goal.is_completed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">
                    <Check className="w-3 h-3" />
                    Realizado
                  </span>
                )}
              </div>

              <h3 className={cn(
                'font-bold text-foreground mb-1',
                goal.is_completed && 'line-through'
              )}>
                {goal.title}
              </h3>

              {goal.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {goal.description}
                </p>
              )}

              {/* Target date */}
              {goal.target_date && (
                <div className={cn(
                  'flex items-center gap-1 text-xs mb-2',
                  isOverdue ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isOverdue ? 'Vencido em ' : 'Meta: '}
                    {formatDate(goal.target_date)}
                  </span>
                </div>
              )}

              {/* Verse reference */}
              {goal.verse_reference && (
                <div className="flex items-start gap-1.5 mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                  <BookOpen className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-primary">
                      {goal.verse_reference}
                    </p>
                    {goal.verse_text && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        "{goal.verse_text}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Completion notes */}
              {goal.is_completed && goal.completion_notes && (
                <div className="mt-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <p className="text-xs text-emerald-600">{goal.completion_notes}</p>
                  {goal.completed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Realizado em {formatDate(goal.completed_at)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {!goal.is_completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompleteDialogOpen(true)}
                  className="text-muted-foreground hover:text-emerald-500"
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {goal.is_completed && (
                    <DropdownMenuItem onClick={handleReopen} disabled={isSubmitting}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reabrir
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark as Completed Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Alvo como Realizado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className={cn('p-3 rounded-lg', config.bgColor)}>
              <p className="text-sm font-medium">{goal.title}</p>
              {goal.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {goal.description}
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
                placeholder="Conte como Deus te ajudou a alcançar este alvo..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkCompleted}
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
