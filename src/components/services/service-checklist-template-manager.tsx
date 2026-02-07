'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ChecklistTemplate,
  ChecklistSection,
  createChecklistTemplate,
  deleteChecklistTemplate,
  updateChecklistTemplate,
} from '@/actions/service-checklist'
import {
  Plus,
  Trash2,
  Loader2,
  Clock,
  Play,
  Flag,
  Pencil,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface ServiceChecklistTemplateManagerProps {
  templates: ChecklistTemplate[]
}

const SECTIONS: { key: ChecklistSection; label: string; icon: typeof Clock; color: string; bg: string }[] = [
  { key: 'ANTES', label: 'Antes do Culto', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'DURANTE', label: 'Durante o Culto', icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'FINAL', label: 'Final do Culto', icon: Flag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
]

export function ServiceChecklistTemplateManager({ templates }: ServiceChecklistTemplateManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSection, setNewSection] = useState<ChecklistSection>('ANTES')
  const [feedback, setFeedback] = useState<string | null>(null)

  const templatesBySection = SECTIONS.map(section => ({
    ...section,
    items: templates.filter(t => t.section === section.key),
  }))

  const openCreateDialog = (section: ChecklistSection) => {
    setEditingTemplate(null)
    setNewTitle('')
    setNewSection(section)
    setDialogOpen(true)
  }

  const openEditDialog = (template: ChecklistTemplate) => {
    setEditingTemplate(template)
    setNewTitle(template.title)
    setNewSection(template.section)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!newTitle.trim()) return
    setFeedback(null)

    startTransition(async () => {
      try {
        if (editingTemplate) {
          const result = await updateChecklistTemplate(editingTemplate.id, {
            title: newTitle.trim(),
            section: newSection,
          })
          if (!result.success) throw new Error(result.error)
        } else {
          const sectionItems = templates.filter(t => t.section === newSection)
          const maxOrder = sectionItems.length > 0
            ? Math.max(...sectionItems.map(t => t.sort_order))
            : -1

          const result = await createChecklistTemplate({
            title: newTitle.trim(),
            section: newSection,
            sort_order: maxOrder + 1,
          })
          if (!result.success) throw new Error(result.error)
        }

        setDialogOpen(false)
        setNewTitle('')
        setEditingTemplate(null)
        router.refresh()
      } catch (error) {
        console.error(error)
        setFeedback('Erro ao salvar item. Tente novamente.')
      }
    })
  }

  const handleDelete = (templateId: string) => {
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await deleteChecklistTemplate(templateId)
        if (!result.success) throw new Error(result.error)
        router.refresh()
      } catch (error) {
        console.error(error)
        setFeedback('Erro ao remover item.')
      }
    })
  }

  return (
    <>
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Checklist do Culto
          </CardTitle>
          <CardDescription>
            Configure os itens que devem ser verificados em cada culto. Esses itens aparecerão automaticamente em todos os cultos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {templatesBySection.map((section) => (
            <div key={section.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', section.bg)}>
                    <section.icon className={cn('h-4 w-4', section.color)} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCreateDialog(section.key)}
                  className="gap-1 text-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 italic pl-10">
                  Nenhum item configurado
                </p>
              ) : (
                <div className="space-y-2 pl-10">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 group hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(item)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {feedback && (
            <p className="text-sm text-destructive text-center font-medium">{feedback}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Item' : 'Novo Item do Checklist'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Altere o título ou a seção deste item.'
                : 'Adicione um item que será verificado em cada culto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">TÍTULO DO ITEM</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Ligar ar-condicionado"
                className="h-12 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">SEÇÃO</Label>
              <div className="grid grid-cols-3 gap-2">
                {SECTIONS.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setNewSection(section.key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                      newSection === section.key
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <section.icon className={cn('h-4 w-4', section.color)} />
                    <span className="text-xs font-bold">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !newTitle.trim()}
              className="rounded-xl"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTemplate ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
