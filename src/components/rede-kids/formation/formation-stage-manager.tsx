'use client'

import { useState } from 'react'
import {
  FormationStage,
  createFormationStage,
  updateFormationStage,
  deleteFormationStage,
  reorderFormationStages,
  seedDefaultFormationStages,
} from '@/actions/kids-formation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  Wand2,
  Heart,
  Sparkles,
  BookOpen,
  GraduationCap,
  Crown,
  Star,
} from 'lucide-react'

const iconOptions = [
  { value: 'heart', label: 'Coração', icon: Heart },
  { value: 'sparkles', label: 'Brilhos', icon: Sparkles },
  { value: 'book-open', label: 'Livro', icon: BookOpen },
  { value: 'graduation-cap', label: 'Formatura', icon: GraduationCap },
  { value: 'crown', label: 'Coroa', icon: Crown },
  { value: 'star', label: 'Estrela', icon: Star },
]

const colorOptions = [
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F59E0B', label: 'Laranja' },
  { value: '#10B981', label: 'Verde' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#6366F1', label: 'Índigo' },
]

interface SortableStageItemProps {
  stage: FormationStage
  onEdit: (stage: FormationStage) => void
  onDelete: (stage: FormationStage) => void
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const IconComponent = iconOptions.find((i) => i.value === stage.icon_name)?.icon || Star

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="h-10 w-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: stage.color }}
      >
        <IconComponent className="h-5 w-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{stage.name}</span>
          {!stage.is_active && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
              Inativo
            </span>
          )}
        </div>
        {stage.description && (
          <p className="text-sm text-muted-foreground truncate">
            {stage.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(stage)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(stage)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface FormationStageManagerProps {
  initialStages: FormationStage[]
}

export function FormationStageManager({ initialStages }: FormationStageManagerProps) {
  const [stages, setStages] = useState<FormationStage[]>(initialStages)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<FormationStage | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSeedingLoading, setIsSeedingLoading] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'star',
    color: '#3B82F6',
    is_active: true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'star',
      color: '#3B82F6',
      is_active: true,
    })
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const result = await createFormationStage({
        name: formData.name,
        description: formData.description || null,
        icon_name: formData.icon_name,
        color: formData.color,
      })

      if (result.success && result.data) {
        setStages([...stages, result.data as FormationStage])
        toast({
          title: 'Etapa criada',
          description: `A etapa "${formData.name}" foi criada com sucesso.`,
        })
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível criar a etapa',
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

  const handleEdit = async () => {
    if (!selectedStage) return

    setIsLoading(true)
    try {
      const result = await updateFormationStage(selectedStage.id, {
        name: formData.name,
        description: formData.description || null,
        icon_name: formData.icon_name,
        color: formData.color,
        is_active: formData.is_active,
      })

      if (result.success && result.data) {
        setStages(
          stages.map((s) =>
            s.id === selectedStage.id ? (result.data as FormationStage) : s
          )
        )
        toast({
          title: 'Etapa atualizada',
          description: `A etapa "${formData.name}" foi atualizada com sucesso.`,
        })
        setIsEditDialogOpen(false)
        setSelectedStage(null)
        resetForm()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível atualizar a etapa',
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

  const handleDelete = async () => {
    if (!selectedStage) return

    setIsLoading(true)
    try {
      const result = await deleteFormationStage(selectedStage.id)

      if (result.success) {
        setStages(stages.filter((s) => s.id !== selectedStage.id))
        toast({
          title: 'Etapa excluída',
          description: `A etapa "${selectedStage.name}" foi excluída.`,
        })
        setIsDeleteDialogOpen(false)
        setSelectedStage(null)
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível excluir a etapa',
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id)
      const newIndex = stages.findIndex((s) => s.id === over.id)

      const newStages = arrayMove(stages, oldIndex, newIndex)
      setStages(newStages)

      // Save new order to database
      const result = await reorderFormationStages(newStages.map((s) => s.id))

      if (!result.success) {
        // Revert on error
        setStages(stages)
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a nova ordem',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSeedDefaults = async () => {
    setIsSeedingLoading(true)
    try {
      const result = await seedDefaultFormationStages()

      if (result.success) {
        toast({
          title: 'Etapas criadas',
          description: 'As etapas padrão foram criadas com sucesso.',
        })
        // Refresh the page to get new stages
        window.location.reload()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível criar as etapas padrão',
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
      setIsSeedingLoading(false)
    }
  }

  const openEditDialog = (stage: FormationStage) => {
    setSelectedStage(stage)
    setFormData({
      name: stage.name,
      description: stage.description || '',
      icon_name: stage.icon_name,
      color: stage.color,
      is_active: stage.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (stage: FormationStage) => {
    setSelectedStage(stage)
    setIsDeleteDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Etapas do Trilho de Formação</CardTitle>
            <CardDescription>
              Configure as etapas da jornada de desenvolvimento espiritual das crianças
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {stages.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={isSeedingLoading}
              >
                {isSeedingLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Criar Etapas Padrão
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Etapa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Etapa</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova etapa ao Trilho de Formação
                  </DialogDescription>
                </DialogHeader>
                <StageForm formData={formData} setFormData={setFormData} />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isLoading || !formData.name}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Criar Etapa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma etapa configurada ainda.</p>
            <p className="text-sm mt-1">
              Clique em "Criar Etapas Padrão" para começar rapidamente.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stages.map((stage) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>
              Atualize as informações da etapa
            </DialogDescription>
          </DialogHeader>
          <StageForm formData={formData} setFormData={setFormData} showActiveSwitch />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !formData.name}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa "{selectedStage?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// Form component for create/edit
interface StageFormProps {
  formData: {
    name: string
    description: string
    icon_name: string
    color: string
    is_active: boolean
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      description: string
      icon_name: string
      color: string
      is_active: boolean
    }>
  >
  showActiveSwitch?: boolean
}

function StageForm({ formData, setFormData, showActiveSwitch = false }: StageFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Etapa *</Label>
        <Input
          id="name"
          placeholder="Ex: Encontro com Deus"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o que esta etapa representa..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select
            value={formData.icon_name}
            onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <Select
            value={formData.color}
            onValueChange={(value) => setFormData({ ...formData, color: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: option.value }}
                    />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showActiveSwitch && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Etapa Ativa</Label>
            <p className="text-sm text-muted-foreground">
              Etapas inativas não aparecem no trilho
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
          />
        </div>
      )}

      {/* Preview */}
      <div className="pt-4 border-t">
        <Label className="text-muted-foreground">Prévia</Label>
        <div className="flex items-center gap-3 mt-2 p-3 bg-muted rounded-lg">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: formData.color }}
          >
            {(() => {
              const Icon =
                iconOptions.find((i) => i.value === formData.icon_name)?.icon || Star
              return <Icon className="h-6 w-6 text-white" />
            })()}
          </div>
          <div>
            <p className="font-medium">{formData.name || 'Nome da Etapa'}</p>
            <p className="text-sm text-muted-foreground">
              {formData.description || 'Descrição da etapa'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
