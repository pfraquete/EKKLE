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
  Plus,
  ChevronUp,
  ChevronDown,
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

interface StageItemProps {
  stage: FormationStage
  index: number
  total: number
  onEdit: (stage: FormationStage) => void
  onDelete: (stage: FormationStage) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function StageItem({ stage, index, total, onEdit, onDelete, onMoveUp, onMoveDown }: StageItemProps) {
  const IconComponent = iconOptions.find((i) => i.value === stage.icon_name)?.icon || Star

  return (
    <div className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

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

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    
    const newStages = [...stages]
    const temp = newStages[index]
    newStages[index] = newStages[index - 1]
    newStages[index - 1] = temp
    
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

  const handleMoveDown = async (index: number) => {
    if (index === stages.length - 1) return
    
    const newStages = [...stages]
    const temp = newStages[index]
    newStages[index] = newStages[index + 1]
    newStages[index + 1] = temp
    
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

  const selectedIcon = iconOptions.find((i) => i.value === formData.icon_name)?.icon || Star
  const SelectedIconComponent = selectedIcon

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Etapas do Trilho</h3>
          <p className="text-sm text-muted-foreground">
            {stages.length} etapa(s) configurada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Etapa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Etapa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova etapa ao Trilho de Formação Kids
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Etapa</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Evangelizado"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que esta etapa representa..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Select
                      value={formData.icon_name}
                      onValueChange={(value) =>
                        setFormData({ ...formData, icon_name: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
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
                      onValueChange={(value) =>
                        setFormData({ ...formData, color: value })
                      }
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
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Pré-visualização
                  </Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: formData.color }}
                    >
                      <SelectedIconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {formData.name || 'Nome da Etapa'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.description || 'Descrição da etapa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isLoading || !formData.name}
                >
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

      {/* Stages List */}
      {stages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma etapa configurada</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crie etapas para definir a jornada de formação das crianças
            </p>
            <Button onClick={handleSeedDefaults} disabled={isSeedingLoading}>
              {isSeedingLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Criar Etapas Padrão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <StageItem
              key={stage.id}
              stage={stage}
              index={index}
              total={stages.length}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>
              Atualize as informações da etapa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Etapa</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
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
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
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
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedStage(null)
                resetForm()
              }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa &quot;{selectedStage?.name}&quot;?
              Esta ação não pode ser desfeita e todo o progresso das crianças
              nesta etapa será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedStage(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
    </div>
  )
}
