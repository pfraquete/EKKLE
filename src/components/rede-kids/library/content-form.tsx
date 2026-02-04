'use client'

import { useState } from 'react'
import { LibraryCategory, createLibraryContent, updateLibraryContent } from '@/actions/kids-library'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const contentTypes = [
  { value: 'lesson', label: 'Lição Bíblica' },
  { value: 'story', label: 'História' },
  { value: 'music', label: 'Música' },
  { value: 'activity', label: 'Atividade' },
  { value: 'video', label: 'Vídeo' },
  { value: 'document', label: 'Documento' },
  { value: 'image', label: 'Imagem' },
  { value: 'other', label: 'Outro' },
]

interface ContentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: LibraryCategory[]
  editingContent?: {
    id: string
    title: string
    description: string | null
    content_type: string
    category_id: string | null
    content_text: string | null
    file_url: string | null
    target_age_min: number | null
    target_age_max: number | null
    duration_minutes: number | null
    bible_reference: string | null
    tags: string[] | null
  } | null
  onSuccess?: () => void
}

export function ContentForm({
  open,
  onOpenChange,
  categories,
  editingContent,
  onSuccess,
}: ContentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState(editingContent?.title || '')
  const [description, setDescription] = useState(editingContent?.description || '')
  const [contentType, setContentType] = useState(editingContent?.content_type || 'lesson')
  const [categoryId, setCategoryId] = useState(editingContent?.category_id || '')
  const [contentText, setContentText] = useState(editingContent?.content_text || '')
  const [fileUrl, setFileUrl] = useState(editingContent?.file_url || '')
  const [targetAgeMin, setTargetAgeMin] = useState(editingContent?.target_age_min?.toString() || '')
  const [targetAgeMax, setTargetAgeMax] = useState(editingContent?.target_age_max?.toString() || '')
  const [durationMinutes, setDurationMinutes] = useState(editingContent?.duration_minutes?.toString() || '')
  const [bibleReference, setBibleReference] = useState(editingContent?.bible_reference || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(editingContent?.tags || [])
  const { toast } = useToast()

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = {
        title,
        description: description || null,
        content_type: contentType as any,
        category_id: categoryId || null,
        content_text: contentText || null,
        file_url: fileUrl || null,
        target_age_min: targetAgeMin ? parseInt(targetAgeMin) : null,
        target_age_max: targetAgeMax ? parseInt(targetAgeMax) : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        bible_reference: bibleReference || null,
        tags: tags.length > 0 ? tags : null,
      }

      let result
      if (editingContent) {
        result = await updateLibraryContent(editingContent.id, data)
      } else {
        result = await createLibraryContent(data)
      }

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: editingContent ? 'Conteúdo atualizado' : 'Conteúdo criado',
        })
        onOpenChange(false)
        onSuccess?.()
        // Reset form
        setTitle('')
        setDescription('')
        setContentType('lesson')
        setCategoryId('')
        setContentText('')
        setFileUrl('')
        setTargetAgeMin('')
        setTargetAgeMax('')
        setDurationMinutes('')
        setBibleReference('')
        setTags([])
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível salvar',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </DialogTitle>
          <DialogDescription>
            Adicione materiais à biblioteca para uso nas células kids
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: A história de Davi e Golias"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Tipo *</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem categoria</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o conteúdo..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bibleReference">Referência Bíblica</Label>
            <Input
              id="bibleReference"
              value={bibleReference}
              onChange={(e) => setBibleReference(e.target.value)}
              placeholder="Ex: 1 Samuel 17:1-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentText">Conteúdo em Texto</Label>
            <Textarea
              id="contentText"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Cole o texto da lição ou história aqui..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">URL do Arquivo (PDF, Imagem, Vídeo)</Label>
            <div className="flex gap-2">
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ageMin">Idade Mínima</Label>
              <Input
                id="ageMin"
                type="number"
                min="0"
                max="18"
                value={targetAgeMin}
                onChange={(e) => setTargetAgeMin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageMax">Idade Máxima</Label>
              <Input
                id="ageMax"
                type="number"
                min="0"
                max="18"
                value={targetAgeMax}
                onChange={(e) => setTargetAgeMax(e.target.value)}
                placeholder="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Adicionar tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingContent ? (
                'Atualizar'
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
