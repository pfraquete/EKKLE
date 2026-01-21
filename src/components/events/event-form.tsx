'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent } from '@/actions/events'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  image_url: string | null
  is_published: boolean
}

type EventFormProps = {
  event?: Event
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date ? event.start_date.split('T')[0] : '',
    end_date: event?.end_date ? event.end_date.split('T')[0] : '',
    location: event?.location || '',
    image_url: event?.image_url || '',
    is_published: event?.is_published || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Convert dates to ISO string
    const submitData = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : '',
    }

    const result = event
      ? await updateEvent(event.id, submitData)
      : await createEvent(submitData)

    if (result.success) {
      router.push('/dashboard/eventos')
      router.refresh()
    } else {
      setError(result.error || 'Erro ao salvar evento')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/eventos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold">
          {event ? 'Editar Evento' : 'Novo Evento'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-2">
            Título do Evento *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Conferência Anual 2024"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Descreva o evento..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-semibold mb-2">
              Data de Início *
            </label>
            <input
              id="start_date"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-semibold mb-2">
              Data de Término
            </label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-semibold mb-2">
            Local
          </label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Endereço do evento"
          />
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-semibold mb-2">
            URL da Imagem
          </label>
          <input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Faça upload da imagem no Supabase Storage e cole a URL aqui
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_published"
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({ ...formData, is_published: e.target.checked })
            }
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="is_published" className="text-sm font-semibold">
            Publicar evento no site público
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Salvando...' : event ? 'Atualizar Evento' : 'Criar Evento'}
        </button>
        <Link
          href="/dashboard/eventos"
          className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
