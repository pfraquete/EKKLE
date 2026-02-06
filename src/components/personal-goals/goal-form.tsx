'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Loader2, Plus, BookOpen } from 'lucide-react'
import { createPersonalGoal, updatePersonalGoal } from '@/actions/personal-goals'
import {
  categoryConfig,
  priorityConfig,
  type PersonalGoal,
  type GoalCategory,
  type GoalPriority,
} from '@/lib/personal-goals-config'

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: PersonalGoal | null
  onSuccess?: () => void
}

const categories: GoalCategory[] = [
  'ESPIRITUAL',
  'FAMILIAR',
  'PROFISSIONAL',
  'FINANCEIRO',
  'SAUDE',
  'MINISTERIAL',
  'EDUCACIONAL',
  'OUTRO',
]

const priorities: GoalPriority[] = ['ALTA', 'MEDIA', 'BAIXA']

export function GoalForm({ open, onOpenChange, goal, onSuccess }: GoalFormProps) {
  const isEditing = !!goal

  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [category, setCategory] = useState<GoalCategory>(goal?.category || 'ESPIRITUAL')
  const [priority, setPriority] = useState<GoalPriority>(goal?.priority || 'MEDIA')
  const [targetDate, setTargetDate] = useState(goal?.target_date || '')
  const [verseReference, setVerseReference] = useState(goal?.verse_reference || '')
  const [verseText, setVerseText] = useState(goal?.verse_text || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('ESPIRITUAL')
    setPriority('MEDIA')
    setTargetDate('')
    setVerseReference('')
    setVerseText('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('O título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        target_date: targetDate || undefined,
        verse_reference: verseReference.trim() || undefined,
        verse_text: verseText.trim() || undefined,
      }

      const result = isEditing
        ? await updatePersonalGoal(goal.id, input)
        : await createPersonalGoal(input)

      if (result.success) {
        onOpenChange(false)
        resetForm()
        onSuccess?.()
      } else {
        setError(result.error || 'Erro ao salvar alvo')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog opens with a goal or closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && goal) {
      setTitle(goal.title)
      setDescription(goal.description || '')
      setCategory(goal.category)
      setPriority(goal.priority)
      setTargetDate(goal.target_date || '')
      setVerseReference(goal.verse_reference || '')
      setVerseText(goal.verse_text || '')
    } else if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Alvo' : 'Novo Alvo Pessoal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ler a Bíblia todos os dias"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu alvo com mais detalhes..."
              rows={2}
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className={cn('font-medium', categoryConfig[cat].color)}>
                        {categoryConfig[cat].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((pri) => (
                    <SelectItem key={pri} value={pri}>
                      <span className={cn('font-medium', priorityConfig[pri].color)}>
                        {priorityConfig[pri].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Data Meta (opcional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Verse Reference */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Versículo de Inspiração (opcional)
            </Label>
            <Input
              value={verseReference}
              onChange={(e) => setVerseReference(e.target.value)}
              placeholder="Ex: Filipenses 4:13"
            />
            <Textarea
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              placeholder="Texto do versículo..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Salvar' : 'Criar Alvo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
