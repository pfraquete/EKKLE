'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService } from '@/actions/services'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Service = {
  id: string
  title: string
  description: string | null
  service_date: string
  service_time: string
  type: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO'
  location: string | null
  youtube_url: string | null
  zoom_meeting_id: string | null
  zoom_password: string | null
  is_published: boolean
}

export function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    service_date: service?.service_date?.split('T')[0] || '',
    service_time: service?.service_time || '',
    type: service?.type || 'PRESENCIAL' as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO',
    location: service?.location || '',
    youtube_url: service?.youtube_url || '',
    zoom_meeting_id: service?.zoom_meeting_id || '',
    zoom_password: service?.zoom_password || '',
    is_published: service?.is_published || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = service
      ? await updateService(service.id, formData)
      : await createService(formData)

    if (result.success) {
      router.push('/dashboard/cultos')
      router.refresh()
    } else {
      setError(result.error || 'Erro ao salvar culto')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cultos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold">{service ? 'Editar Culto' : 'Novo Culto'}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-2">Título do Culto *</label>
          <input id="title" type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Culto de Domingo" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2">Descrição</label>
          <textarea id="description" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="Descreva o culto..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="service_date" className="block text-sm font-semibold mb-2">Data *</label>
            <input id="service_date" type="date" required value={formData.service_date} onChange={(e) => setFormData({ ...formData, service_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="service_time" className="block text-sm font-semibold mb-2">Horário *</label>
            <input id="service_time" type="time" required value={formData.service_time} onChange={(e) => setFormData({ ...formData, service_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-semibold mb-2">Tipo *</label>
            <select id="type" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="PRESENCIAL">Presencial</option>
              <option value="ONLINE">Online</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </div>

        {formData.type !== 'ONLINE' && (
          <div>
            <label htmlFor="location" className="block text-sm font-semibold mb-2">Local</label>
            <input id="location" type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Endereço do culto" />
          </div>
        )}

        {formData.type !== 'PRESENCIAL' && (
          <>
            <div>
              <label htmlFor="youtube_url" className="block text-sm font-semibold mb-2">URL do YouTube</label>
              <input id="youtube_url" type="url" value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="zoom_meeting_id" className="block text-sm font-semibold mb-2">Zoom Meeting ID</label>
                <input id="zoom_meeting_id" type="text" value={formData.zoom_meeting_id} onChange={(e) => setFormData({ ...formData, zoom_meeting_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="123 456 7890" />
              </div>
              <div>
                <label htmlFor="zoom_password" className="block text-sm font-semibold mb-2">Zoom Password</label>
                <input id="zoom_password" type="text" value={formData.zoom_password} onChange={(e) => setFormData({ ...formData, zoom_password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="senha123" />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <input id="is_published" type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
          <label htmlFor="is_published" className="text-sm font-semibold">Publicar culto no site público</label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Salvando...' : service ? 'Atualizar Culto' : 'Criar Culto'}
        </button>
        <Link href="/dashboard/cultos" className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50 transition-colors">Cancelar</Link>
      </div>
    </form>
  )
}
