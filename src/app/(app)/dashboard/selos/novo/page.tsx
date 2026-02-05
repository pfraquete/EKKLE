'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBadge } from '@/actions/badges'
import { Award, ArrowLeft, Upload, Eye, EyeOff, Save } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function NovoSeloPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    opening_page: 'feed',
    always_visible: false,
    relevance: 0
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `badge-${Date.now()}.${fileExt}`
      const filePath = `badges/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('badges')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('badges')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      toast.success('Imagem enviada com sucesso')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('O nome do selo é obrigatório')
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('name', formData.name)
      form.append('description', formData.description)
      form.append('image_url', imageUrl || '')
      form.append('opening_page', formData.opening_page)
      form.append('always_visible', String(formData.always_visible))
      form.append('relevance', String(formData.relevance))

      const { data, error } = await createBadge(form)
      
      if (error) {
        toast.error(error)
        return
      }

      toast.success('Selo criado com sucesso!')
      router.push('/dashboard/selos')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar selo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/selos"
          className="p-2 hover:bg-gray-bg rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-text flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            Novo Selo
          </h1>
          <p className="text-gray-text-muted mt-1">
            Crie um novo selo para reconhecer os membros
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-gray-card border border-gray-border rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-text mb-3">
            Imagem do Selo
          </label>
          <p className="text-sm text-gray-text-muted mb-4">
            Tamanho recomendado: 50x50 pixels. Formatos aceitos: PNG, JPG, SVG.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-bg border-2 border-dashed border-gray-border flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <Award className="h-8 w-8 text-gray-text-muted" />
              )}
            </div>
            
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-bg hover:bg-gray-border text-gray-text rounded-xl transition-colors">
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-gray-text border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Escolher imagem
                    </>
                  )}
                </span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="ml-3 text-sm text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-gray-card border border-gray-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              Nome do Selo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Batizado, Líder de Célula, Conferência 2025..."
              className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-xl text-gray-text placeholder:text-gray-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o significado deste selo e como conquistá-lo..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-xl text-gray-text placeholder:text-gray-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
            <p className="text-xs text-gray-text-muted mt-1">
              Se incluir um link, o usuário será redirecionado ao clicar no selo.
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gray-card border border-gray-border rounded-2xl p-6 space-y-4">
          <h3 className="font-medium text-gray-text">Configurações</h3>

          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              Página de Abertura
            </label>
            <select
              value={formData.opening_page}
              onChange={(e) => setFormData({ ...formData, opening_page: e.target.value })}
              className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-xl text-gray-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="feed">Feed</option>
              <option value="courses">Cursos</option>
              <option value="events">Eventos</option>
              <option value="cells">Células</option>
              <option value="profile">Perfil</option>
            </select>
            <p className="text-xs text-gray-text-muted mt-1">
              Página para onde o usuário será direcionado ao clicar no selo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              Relevância (Ordem de Exibição)
            </label>
            <input
              type="number"
              value={formData.relevance}
              onChange={(e) => setFormData({ ...formData, relevance: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-32 px-4 py-3 bg-gray-bg border border-gray-border rounded-xl text-gray-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <p className="text-xs text-gray-text-muted mt-1">
              Quanto maior o número, mais destaque o selo terá no perfil.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-bg rounded-xl">
            <div className="flex items-center gap-3">
              {formData.always_visible ? (
                <Eye className="h-5 w-5 text-emerald-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-text-muted" />
              )}
              <div>
                <p className="font-medium text-gray-text">Sempre Visível</p>
                <p className="text-sm text-gray-text-muted">
                  Mostrar selo mesmo quando não conquistado
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, always_visible: !formData.always_visible })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.always_visible ? 'bg-emerald-500' : 'bg-gray-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.always_visible ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/dashboard/selos"
            className="px-6 py-3 text-gray-text-muted hover:text-gray-text transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Criar Selo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
