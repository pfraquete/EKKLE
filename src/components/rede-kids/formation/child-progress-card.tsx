'use client'

import { useState } from 'react'
import { FormationStage, ChildFormationProgress, ChildWithProgress, markStageAsCompleted } from '@/actions/kids-formation'
import { FormationTrackView } from './formation-track-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Award, Plus, Loader2 } from 'lucide-react'

interface ChildProgressCardProps {
  child: ChildWithProgress
  stages: FormationStage[]
  canEdit?: boolean
}

export function ChildProgressCard({
  child,
  stages,
  canEdit = false,
}: ChildProgressCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<FormationStage | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleStageClick = (stage: FormationStage) => {
    if (!canEdit) return

    // Check if already completed
    const isCompleted = child.completed_stages.some((p) => p.stage_id === stage.id)
    if (isCompleted) {
      toast({
        title: 'Etapa já concluída',
        description: 'Esta etapa já foi marcada como concluída.',
        variant: 'default',
      })
      return
    }

    setSelectedStage(stage)
    setNotes('')
    setIsDialogOpen(true)
  }

  const handleMarkComplete = async () => {
    if (!selectedStage) return

    setIsLoading(true)
    try {
      const result = await markStageAsCompleted({
        childId: child.id,
        stageId: selectedStage.id,
        notes: notes || null,
      })

      if (result.success) {
        toast({
          title: 'Etapa concluída!',
          description: `${child.full_name} completou a etapa "${selectedStage.name}"`,
        })
        setIsDialogOpen(false)
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível marcar a etapa como concluída',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = Math.round(
    (child.completed_stages.length / stages.length) * 100
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Trilho de Formação</CardTitle>
                <CardDescription>
                  Jornada de desenvolvimento espiritual
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={progressPercentage === 100 ? 'default' : 'secondary'}
              className="text-sm"
            >
              {progressPercentage}% concluído
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Formation Track */}
          <FormationTrackView
            stages={stages}
            completedProgress={child.completed_stages}
            currentStageId={child.current_stage?.id}
            size="md"
            showLabels={true}
            interactive={canEdit}
            onStageClick={handleStageClick}
          />

          {/* Current Stage Info */}
          {child.current_stage && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Etapa atual: {child.current_stage.name}
              </p>
              {child.current_stage.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {child.current_stage.description}
                </p>
              )}
            </div>
          )}

          {/* Next Stage Info */}
          {child.next_stage && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Próxima etapa: {child.next_stage.name}
                  </p>
                  {child.next_stage.description && (
                    <p className="text-sm text-orange-600/80 mt-1">
                      {child.next_stage.description}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => handleStageClick(child.next_stage!)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Marcar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Completed Message */}
          {!child.next_stage && child.completed_stages.length === stages.length && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-sm font-medium text-green-700">
                🎉 Parabéns! {child.full_name} completou todo o Trilho de Formação!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Stage Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Etapa como Concluída</DialogTitle>
            <DialogDescription>
              Confirme que {child.full_name} completou a etapa "{selectedStage?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre a conclusão desta etapa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleMarkComplete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar Conclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
