'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminCreateCourse } from '@/actions/courses-admin'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cursos" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-3xl font-bold">Novo Curso</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">{error}</p></div>}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Título *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" placeholder="Nome do curso" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Descrição</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary resize-none" placeholder="Sobre o curso..." />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">URL da Thumbnail</label>
          <input type="url" value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Quantidade de módulos</label>
            <input
              type="number"
              min={0}
              value={formData.modules_count}
              onChange={(e) => setFormData({ ...formData, modules_count: Number(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Data de início das inscrições</label>
            <input
              type="date"
              value={formData.enrollment_start_date}
              onChange={(e) => setFormData({ ...formData, enrollment_start_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={formData.is_paid} onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 rounded" />
            <label className="text-sm font-semibold">Curso pago</label>
          </div>
          {formData.is_paid && (
            <div>
              <label className="block text-sm font-semibold mb-2">Preço (R$)</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Ex: 49,90"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 rounded" />
          <label className="text-sm font-semibold">Publicar curso no site</label>
        </div>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Criando...' : 'Criar Curso'}
        </button>
        <Link href="/dashboard/cursos" className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50">Cancelar</Link>
      </div>
    </form>
  )
}
