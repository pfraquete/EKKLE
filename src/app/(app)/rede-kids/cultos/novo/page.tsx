'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calendar, Clock, BookOpen, FileText } from 'lucide-react'
import { createKidsWorshipService } from '@/actions/kids-worship'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function NovoCultoKidsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    service_date: '',
    service_time: '',
    theme: '',
    bible_verse: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createKidsWorshipService({
        title: formData.title,
        service_date: formData.service_date,
        service_time: formData.service_time || null,
        theme: formData.theme || null,
        bible_verse: formData.bible_verse || null,
        description: formData.description || null,
      })

      if (result.success) {
        toast.success('Culto kids criado com sucesso!')
        router.push('/rede-kids/cultos')
      } else {
        toast.error(result.error || 'Erro ao criar culto kids')
      }
    } catch (error) {
      toast.error('Erro ao criar culto kids')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/rede-kids/cultos"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Culto Kids</h1>
          <p className="text-muted-foreground">
            Agende um novo culto kids para a igreja
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Título do Culto *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Culto Kids de Domingo"
            required
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data *
            </Label>
            <Input
              id="service_date"
              type="date"
              value={formData.service_date}
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário
            </Label>
            <Input
              id="service_time"
              type="time"
              value={formData.service_time}
              onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
            />
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <Label htmlFor="theme" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Tema
          </Label>
          <Input
            id="theme"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            placeholder="Ex: O amor de Deus"
          />
        </div>

        {/* Bible Verse */}
        <div className="space-y-2">
          <Label htmlFor="bible_verse">Versículo Bíblico</Label>
          <Input
            id="bible_verse"
            value={formData.bible_verse}
            onChange={(e) => setFormData({ ...formData, bible_verse: e.target.value })}
            placeholder="Ex: João 3:16"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição ou observações sobre o culto..."
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link href="/rede-kids/cultos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Culto'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
