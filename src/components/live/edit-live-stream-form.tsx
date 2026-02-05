'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Loader2, Globe, Lock, MessageSquare, MessageSquareOff } from 'lucide-react'
import { updateLiveStream, LiveStream } from '@/actions/live-streams'
import { toast } from 'sonner'

interface EditLiveStreamFormProps {
  stream: LiveStream
}

export function EditLiveStreamForm({ stream }: EditLiveStreamFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(stream.title)
  const [description, setDescription] = useState(stream.description || '')
  const [scheduledStart, setScheduledStart] = useState(
    stream.scheduled_start 
      ? new Date(stream.scheduled_start).toISOString().slice(0, 16)
      : ''
  )
  const [youtubeUrl, setYoutubeUrl] = useState(stream.youtube_url || '')
  const [customEmbedUrl, setCustomEmbedUrl] = useState(stream.custom_embed_url || '')
  const [chatEnabled, setChatEnabled] = useState(stream.chat_enabled)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Informe o título da transmissão')
      return
    }

    if (stream.provider === 'YOUTUBE' && !youtubeUrl.trim()) {
      toast.error('Informe o link do YouTube')
      return
    }

    if (stream.provider === 'CUSTOM' && !customEmbedUrl.trim()) {
      toast.error('Informe o link da transmissão')
      return
    }

    setLoading(true)

    const result = await updateLiveStream(stream.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_start: scheduledStart || undefined,
      youtube_url: stream.provider === 'YOUTUBE' ? youtubeUrl.trim() : undefined,
      custom_embed_url: stream.provider === 'CUSTOM' ? customEmbedUrl.trim() : undefined,
      chat_enabled: chatEnabled,
    })

    setLoading(false)

    if (result.success) {
      toast.success('Transmissão atualizada com sucesso!')
      router.push(`/dashboard/lives/${stream.id}`)
    } else {
      toast.error(result.error || 'Erro ao atualizar transmissão')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Info (read-only) */}
      <div className="p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tipo de transmissão:</span>{' '}
          {stream.provider === 'YOUTUBE' && 'YouTube Live'}
          {stream.provider === 'MUX' && (stream.broadcast_type === 'browser' ? 'Navegador (LiveKit)' : 'OBS/RTMP (Mux)')}
          {stream.provider === 'CUSTOM' && 'Link Personalizado'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          O tipo de transmissão não pode ser alterado após a criação.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Título da Transmissão *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Culto de Domingo"
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o conteúdo da transmissão..."
          rows={3}
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* YouTube URL */}
      {stream.provider === 'YOUTUBE' && (
        <div className="space-y-2">
          <label htmlFor="youtube" className="text-sm font-medium text-foreground">
            Link do YouTube *
          </label>
          <input
            id="youtube"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required={stream.provider === 'YOUTUBE'}
          />
          <p className="text-xs text-muted-foreground">
            Cole o link da sua live do YouTube ou o link de um vídeo
          </p>
        </div>
      )}

      {/* Custom Embed URL */}
      {stream.provider === 'CUSTOM' && (
        <div className="space-y-2">
          <label htmlFor="custom" className="text-sm font-medium text-foreground">
            Link da Transmissão *
          </label>
          <input
            id="custom"
            type="url"
            value={customEmbedUrl}
            onChange={(e) => setCustomEmbedUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required={stream.provider === 'CUSTOM'}
          />
          <p className="text-xs text-muted-foreground">
            Suporta links de embed ou streams HLS (.m3u8)
          </p>
        </div>
      )}

      {/* Scheduled Start */}
      <div className="space-y-2">
        <label htmlFor="scheduled" className="text-sm font-medium text-foreground">
          Data e Hora (opcional)
        </label>
        <input
          id="scheduled"
          type="datetime-local"
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground">
          Defina quando a transmissão está programada para começar
        </p>
      </div>

      {/* Chat Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
        <div className="flex items-start gap-3">
          {chatEnabled ? (
            <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
          ) : (
            <MessageSquareOff className="w-5 h-5 text-muted-foreground mt-0.5" />
          )}
          <div>
            <h4 className="font-medium text-sm">Chat ao Vivo</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permite que os membros enviem mensagens durante a live
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setChatEnabled(!chatEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            chatEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
              chatEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Public Status (read-only info) */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
        {stream.is_public ? (
          <Globe className="w-5 h-5 text-green-500" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <h4 className="font-medium text-sm">
            {stream.is_public ? 'Live Pública' : 'Live Privada'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stream.is_public
              ? 'Visitantes podem assistir sem fazer login'
              : 'Apenas membros logados podem assistir'}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Radio className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  )
}
