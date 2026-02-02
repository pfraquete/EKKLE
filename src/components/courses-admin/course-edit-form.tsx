'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminCreateCourse } from '@/actions/courses-admin'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export function CourseEditForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    order_index: 0,
    is_published: false,
    modules_count: 0,
    is_paid: false,
    price: '',
    enrollment_start_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const parsedPrice = formData.is_paid
      ? Math.round(Number(formData.price.replace(',', '.')) * 100)
      : 0

    const result = await adminCreateCourse({
      ...formData,
      price_cents: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
    })

    if (result.success) {
      router.push(`/dashboard/cursos/${result.course?.id}`)
      router.refresh()
    } else {
      setError(result.error || 'Erro ao criar curso')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-4xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/cursos"
            className="p-4 bg-muted/40 hover:bg-muted/80 border border-border/50 rounded-2xl transition-all duration-300 overflow-hidden group"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter italic uppercase italic">Novo Curso</h1>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">Crie conteúdos incríveis para sua igreja</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 shadow-2xl animate-in shake duration-500">
          <p className="text-destructive font-black text-xs uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 gap-8 relative z-10">
          <div className="space-y-3">
            <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Título do Curso *</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 text-base"
              placeholder="Ex: Fundamentos da Fé"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Descrição Detalhada</Label>
            <Textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-muted/30 border-border/40 rounded-2xl p-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 resize-none text-base"
              placeholder="Descreva o que os alunos aprenderão neste curso..."
            />
          </div>

          <div className="space-y-3">
            <ImageUpload
              value={formData.thumbnail_url}
              onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
              bucket="course-images"
              label="Thumbnail do Curso"
              aspectRatio="video"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Qtd. de Módulos</Label>
              <Input
                type="number"
                min={0}
                value={formData.modules_count}
                onChange={(e) => setFormData({ ...formData, modules_count: Number(e.target.value) })}
                className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-base"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Início das Inscrições</Label>
              <Input
                type="date"
                value={formData.enrollment_start_date}
                onChange={(e) => setFormData({ ...formData, enrollment_start_date: e.target.value })}
                className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-base block"
              />
            </div>
          </div>

          <div className="bg-muted/20 border border-border/30 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Checkbox
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => setFormData({ ...formData, is_paid: !!checked })}
                className="w-6 h-6 border-border/50 rounded-lg data-[state=checked]:bg-primary"
              />
              <Label htmlFor="is_paid" className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">Curso Pago / Investimento</Label>
            </div>

            {formData.is_paid && (
              <div className="space-y-3 pl-10 animate-in slide-in-from-left-4 duration-500">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Valor (R$)</Label>
                <Input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-16 bg-muted/40 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-base"
                  placeholder="Ex: 49,90"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-[2rem] p-8">
            <Checkbox
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: !!checked })}
              className="w-6 h-6 border-primary/30 rounded-lg data-[state=checked]:bg-primary"
            />
            <Label htmlFor="is_published" className="text-xs font-black uppercase tracking-widest text-primary cursor-pointer select-none">Publicar Imediatamente no Site</Label>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-16 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Processando...' : 'Criar Novo Curso'}
        </button>
        <Link
          href="/dashboard/cursos"
          className="flex-1 h-16 border border-border/50 bg-muted/20 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/40 transition-all flex items-center justify-center shadow-lg"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
