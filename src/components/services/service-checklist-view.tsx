'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChecklistTemplate,
  ChecklistItem,
  toggleChecklistItem,
} from '@/actions/service-checklist'
import { Clock, Play, Flag, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceChecklistViewProps {
  serviceId: string
  templates: ChecklistTemplate[]
  items: (ChecklistItem & { completed_profile?: { full_name: string } | null })[]
}

const SECTION_CONFIG = {
  ANTES: { label: 'Antes do Culto', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  DURANTE: { label: 'Durante o Culto', icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  FINAL: { label: 'Final do Culto', icon: Flag, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const

export function ServiceChecklistView({ serviceId, templates, items }: ServiceChecklistViewProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)

  const itemsByTemplateId = new Map(localItems.map(item => [item.template_id, item]))

  const sections = (['ANTES', 'DURANTE', 'FINAL'] as const).map(section => ({
    key: section,
    ...SECTION_CONFIG[section],
    templates: templates.filter(t => t.section === section),
  })).filter(s => s.templates.length > 0)

  const totalItems = templates.length
  const completedItems = localItems.filter(i => i.is_completed).length

  const handleToggle = (item: ChecklistItem) => {
    setPendingItemId(item.id)

    // Optimistic update
    setLocalItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, is_completed: !i.is_completed, completed_at: !i.is_completed ? new Date().toISOString() : null }
          : i
      )
    )

    startTransition(async () => {
      try {
        const result = await toggleChecklistItem(item.id, serviceId)
        if (!result.success) {
          // Revert optimistic update
          setLocalItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? { ...i, is_completed: !i.is_completed }
                : i
            )
          )
        }
      } catch {
        // Revert on error
        setLocalItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, is_completed: !i.is_completed }
              : i
          )
        )
      } finally {
        setPendingItemId(null)
      }
    })
  }

  if (templates.length === 0) {
    return (
      <Card className="border-none shadow-xl">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Nenhum checklist configurado</h3>
          <p className="text-sm text-muted-foreground/60">
            O pastor pode configurar o checklist em Gerenciar Cultos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <Card className="border-none shadow-xl">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-muted-foreground">Progresso do Culto</span>
            <span className="text-sm font-black text-primary">
              {completedItems}/{totalItems}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: totalItems > 0 ? `${(completedItems / totalItems) * 100}%` : '0%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.key} className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', section.bg)}>
                <section.icon className={cn('h-5 w-5', section.color)} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </p>
                <p className="text-xs text-muted-foreground/60 font-normal">
                  {section.templates.filter(t => itemsByTemplateId.get(t.id)?.is_completed).length}/{section.templates.length} concluídos
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-muted/50">
            {section.templates.map((template) => {
              const item = itemsByTemplateId.get(template.id)
              if (!item) return null

              const isCompleted = item.is_completed
              const isLoading = pendingItemId === item.id && isPending

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleToggle(item)}
                  disabled={isLoading}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 transition-all text-left',
                    isCompleted
                      ? 'bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted/30'
                  )}
                >
                  <div className="relative">
                    {isLoading ? (
                      <div className="h-5 w-5 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Checkbox
                        checked={isCompleted}
                        tabIndex={-1}
                        className="pointer-events-none"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-semibold transition-all',
                      isCompleted
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}>
                      {template.title}
                    </p>
                    {isCompleted && item.completed_profile?.full_name && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        por {item.completed_profile.full_name}
                      </p>
                    )}
                  </div>
                  {isCompleted && !isLoading && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
