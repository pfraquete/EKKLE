'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Youtube, Link as LinkIcon, Loader2, Globe, Lock, Camera, Monitor } from 'lucide-react'
import { createLiveStream, LiveStreamProvider, BroadcastType } from '@/actions/live-streams'
import { checkLiveKitConfig } from '@/actions/livekit'
import { toast } from 'sonner'

export function NewLiveStreamForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<LiveStreamProvider>('YOUTUBE')
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('rtmp')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [customEmbedUrl, setCustomEmbedUrl] = useState('')
  const [chatEnabled, setChatEnabled] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [liveKitConfigured, setLiveKitConfigured] = useState(false)

  // Check if LiveKit is configured
  useEffect(() => {
    async function checkConfig() {
      const result = await checkLiveKitConfig()
      setLiveKitConfigured(result.configured)
    }
    checkConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Informe o titulo da transmissao')
      return
    }

    if (provider === 'YOUTUBE' && !youtubeUrl.trim()) {
      toast.error('Informe o link do YouTube')
      return
    }

    if (provider === 'CUSTOM' && !customEmbedUrl.trim()) {
      toast.error('Informe o link da transmissao')
      return
    }

    setLoading(true)

    const result = await createLiveStream({
      title: title.trim(),
      description: description.trim() || undefined,
      provider,
      broadcast_type: provider === 'MUX' ? broadcastType : 'rtmp',
      scheduled_start: scheduledStart || undefined,
      youtube_url: provider === 'YOUTUBE' ? youtubeUrl.trim() : undefined,
      custom_embed_url: provider === 'CUSTOM' ? customEmbedUrl.trim() : undefined,
      chat_enabled: chatEnabled,
      is_public: isPublic,
    })

    setLoading(false)

    if (result.success) {
      toast.success('Transmissao criada com sucesso!')
      router.push(`/dashboard/lives/${result.data?.id}`)
    } else {
      toast.error(result.error || 'Erro ao criar transmissao')
    }
  }

  const providers = [
    {
      id: 'YOUTUBE' as const,
      label: 'YouTube Live',
      description: 'Use sua live do YouTube',
      icon: Youtube,
      color: 'text-red-500',
    },
    {
      id: 'MUX' as const,
      label: 'Mux (RTMP)',
      description: 'Transmita via OBS ou similar',
      icon: Radio,
      color: 'text-purple-500',
    },
    {
      id: 'CUSTOM' as const,
      label: 'Link Personalizado',
      description: 'Use qualquer link de stream',
      icon: LinkIcon,
      color: 'text-blue-500',
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Tipo de Transmissao
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p) => {
            const Icon = p.icon
            const isSelected = provider === p.id

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : p.color}`} />
                <h3 className="font-bold text-sm">{p.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Titulo da Transmissao *
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
          Descricao (opcional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o conteudo da transmissao..."
          rows={3}
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* YouTube URL */}
      {provider === 'YOUTUBE' && (
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
            required={provider === 'YOUTUBE'}
          />
          <p className="text-xs text-muted-foreground">
            Cole o link da sua live do YouTube ou o link de um video
          </p>
        </div>
      )}

      {/* Custom Embed URL */}
      {provider === 'CUSTOM' && (
        <div className="space-y-2">
          <label htmlFor="custom" className="text-sm font-medium text-foreground">
            Link da Transmissao *
          </label>
          <input
            id="custom"
            type="url"
            value={customEmbedUrl}
            onChange={(e) => setCustomEmbedUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required={provider === 'CUSTOM'}
          />
          <p className="text-xs text-muted-foreground">
            Suporta links de embed ou streams HLS (.m3u8)
          </p>
        </div>
      )}

      {/* Mux Broadcast Type Selection */}
      {provider === 'MUX' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Como voce quer transmitir?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Browser Option */}
            <button
              type="button"
              onClick={() => setBroadcastType('browser')}
              disabled={!liveKitConfigured}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                broadcastType === 'browser'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80 hover:bg-muted/50'
              } ${!liveKitConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Camera className={`w-6 h-6 mb-2 ${broadcastType === 'browser' ? 'text-primary' : 'text-green-500'}`} />
              <h3 className="font-bold text-sm">Pelo Navegador</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use sua camera ou compartilhe sua tela direto do navegador
              </p>
              {!liveKitConfigured && (
                <p className="text-xs text-yellow-500 mt-2">
                  LiveKit nao configurado
                </p>
              )}
            </button>

            {/* RTMP Option */}
            <button
              type="button"
              onClick={() => setBroadcastType('rtmp')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                broadcastType === 'rtmp'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80 hover:bg-muted/50'
              }`}
            >
              <Monitor className={`w-6 h-6 mb-2 ${broadcastType === 'rtmp' ? 'text-primary' : 'text-purple-500'}`} />
              <h3 className="font-bold text-sm">OBS / Software Externo</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use OBS Studio, Streamlabs ou outro software RTMP
              </p>
            </button>
          </div>

          {/* Info based on selection */}
          {broadcastType === 'browser' && liveKitConfigured && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h4 className="font-bold text-sm text-green-500 mb-2">Transmissao pelo Navegador</h4>
              <p className="text-sm text-muted-foreground">
                Apos criar a transmissao, voce podera usar sua camera ou compartilhar sua tela
                diretamente do navegador. Nao e necessario nenhum software adicional.
              </p>
            </div>
          )}

          {broadcastType === 'rtmp' && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-bold text-sm text-purple-500 mb-2">Transmissao via RTMP</h4>
              <p className="text-sm text-muted-foreground">
                Apos criar a transmissao, voce recebera uma chave de stream para usar no OBS Studio,
                Streamlabs ou outro software de transmissao.
              </p>
            </div>
          )}
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
          Defina quando a transmissao esta programada para comecar
        </p>
      </div>

      {/* Chat Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
        <div>
          <h4 className="font-medium text-sm">Chat ao Vivo</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permite que os membros enviem mensagens durante a live
          </p>
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

      {/* Public Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
        <div className="flex items-start gap-3">
          {isPublic ? (
            <Globe className="w-5 h-5 text-green-500 mt-0.5" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
          )}
          <div>
            <h4 className="font-medium text-sm">
              {isPublic ? 'Live Publica' : 'Live Privada'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublic
                ? 'Visitantes podem assistir sem fazer login'
                : 'Apenas membros logados podem assistir'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isPublic ? 'bg-green-500' : 'bg-muted-foreground/30'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
              isPublic ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
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
              Criando...
            </>
          ) : (
            <>
              <Radio className="w-5 h-5" />
              Criar Transmissao
            </>
          )}
        </button>
      </div>
    </form>
  )
}
