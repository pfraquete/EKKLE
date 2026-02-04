'use client'

import { useState, useEffect } from 'react'
import { FormationStage, bulkMarkStageAsCompleted, getActiveFormationStages } from '@/actions/kids-formation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Users, Loader2, CheckCircle2, XCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Child {
  id: string
  full_name: string
  photo_url?: string | null
}

interface BulkMarkStageDialogProps {
  children: Child[]
  onSuccess?: () => void
}

export function BulkMarkStageDialog({ children, onSuccess }: BulkMarkStageDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stages, setStages] = useState<FormationStage[]>([])
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    childId: string
    childName: string
    success: boolean
    reason?: string
  }[] | null>(null)
  const { toast } = useToast()

  // Load stages when dialog opens
  useEffect(() => {
    if (isOpen) {
      getActiveFormationStages().then(setStages)
    }
  }, [isOpen])

  // Filter children by search
  const filteredChildren = children.filter(child =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectAll = () => {
    if (selectedChildIds.length === filteredChildren.length) {
      setSelectedChildIds([])
    } else {
      setSelectedChildIds(filteredChildren.map(c => c.id))
    }
  }

  const handleToggleChild = (childId: string) => {
    setSelectedChildIds(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    )
  }

  const handleSubmit = async () => {
    if (!selectedStageId || selectedChildIds.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma etapa e pelo menos uma criança',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const result = await bulkMarkStageAsCompleted({
        childIds: selectedChildIds,
        stageId: selectedStageId,
        notes: notes || null,
      })

      if (result.success) {
        setResults(result.results)
        toast({
          title: 'Sucesso!',
          description: `${result.markedCount} criança(s) marcada(s). ${result.skippedCount} já haviam completado.`,
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível marcar as etapas',
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

  const handleClose = () => {
    setIsOpen(false)
    setSelectedChildIds([])
    setSelectedStageId('')
    setNotes('')
    setSearchQuery('')
    setResults(null)
  }

  const selectedStage = stages.find(s => s.id === selectedStageId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Marcar em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Marcar Etapa em Lote</DialogTitle>
          <DialogDescription>
            Marque uma etapa do Trilho de Formação para múltiplas crianças de uma vez
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 py-4">
            {/* Stage Selection */}
            <div className="space-y-2">
              <Label>Etapa a ser marcada</Label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Children Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Crianças ({selectedChildIds.length} selecionada(s))</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedChildIds.length === filteredChildren.length
                    ? 'Desmarcar todas'
                    : 'Selecionar todas'}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar criança..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-1">
                  {filteredChildren.map(child => (
                    <label
                      key={child.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedChildIds.includes(child.id)}
                        onCheckedChange={() => handleToggleChild(child.id)}
                      />
                      <span className="text-sm">{child.full_name}</span>
                    </label>
                  ))}
                  {filteredChildren.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma criança encontrada
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Observações (opcional)</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Adicione observações que serão aplicadas a todas as crianças..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Summary */}
            {selectedStage && selectedChildIds.length > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm">
                  <strong>{selectedChildIds.length}</strong> criança(s) serão marcadas na etapa{' '}
                  <Badge
                    variant="outline"
                    style={{ borderColor: selectedStage.color, color: selectedStage.color }}
                  >
                    {selectedStage.name}
                  </Badge>
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Results View */
          <div className="py-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {results.map(result => (
                  <div
                    key={result.childId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{result.childName}</span>
                    </div>
                    {!result.success && result.reason && (
                      <span className="text-xs text-muted-foreground">{result.reason}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {!results ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedStageId || selectedChildIds.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar {selectedChildIds.length} Criança(s)
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
