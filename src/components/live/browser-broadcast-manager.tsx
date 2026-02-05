'use client'

import { useState, useEffect, useRef } from 'react'
import { WebBroadcaster } from './web-broadcaster'
import { LivePlayer } from './live-player'
import {
  getLiveKitBroadcasterToken,
  startBrowserBroadcast,
  stopBrowserBroadcast
} from '@/actions/livekit'
import { toast } from 'sonner'
import { Loader2, Camera, Monitor, AlertCircle } from 'lucide-react'

interface LiveStream {
  id: string
  title: string
  status: string
  broadcast_type?: string | null
  livekit_room_name?: string | null
  mux_playback_id?: string | null
  provider: string
}

interface Props {
  stream: LiveStream
}

export function BrowserBroadcastManager({ stream }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(stream.status === 'LIVE')
  const [isStarting, setIsStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'broadcaster' | 'viewer'>('broadcaster')
  
  // Use ref to track if token was already fetched
  const tokenFetchedRef = useRef(false)

  // Get LiveKit token on mount - only once
  useEffect(() => {
    if (tokenFetchedRef.current) return
    
    async function getToken() {
      if (!stream.livekit_room_name) {
        setError('Room nao configurado para esta transmissao')
        setLoading(false)
        return
      }

      try {
        tokenFetchedRef.current = true
        const result = await getLiveKitBroadcasterToken(stream.id)

        if (result.success && result.token && result.wsUrl) {
          setToken(result.token)
          setWsUrl(result.wsUrl)
        } else {
          setError(result.error || 'Erro ao obter token de transmissao')
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor')
      } finally {
        setLoading(false)
      }
    }

    getToken()
  }, [stream.id, stream.livekit_room_name])

  // Update isLive when stream status changes
  useEffect(() => {
    setIsLive(stream.status === 'LIVE')
  }, [stream.status])

  const handleGoLive = async () => {
    setIsStarting(true)
    try {
      const result = await startBrowserBroadcast(stream.id)

      if (result.success) {
        setIsLive(true)
        toast.success('Transmissao iniciada!')
      } else {
        toast.error(result.error || 'Erro ao iniciar transmissao')
      }
    } catch (err) {
      toast.error('Erro ao iniciar transmissao')
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndLive = async () => {
    try {
      const result = await stopBrowserBroadcast(stream.id)

      if (result.success) {
        setIsLive(false)
        toast.success('Transmissao encerrada!')
      } else {
        toast.error(result.error || 'Erro ao encerrar transmissao')
      }
    } catch (err) {
      toast.error('Erro ao encerrar transmissao')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70">Preparando transmissao...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Erro na Transmissao</h3>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <p className="text-white/50 text-xs">
            Verifique se as variaveis de ambiente do LiveKit estao configuradas corretamente.
          </p>
        </div>
      </div>
    )
  }

  // No token/wsUrl yet
  if (!token || !wsUrl || !stream.livekit_room_name) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Configuracao Incompleta</h3>
          <p className="text-white/70 text-sm">
            Nao foi possivel carregar o broadcaster. Verifique a configuracao.
          </p>
        </div>
      </div>
    )
  }

  // Main render - ALWAYS keep WebBroadcaster mounted to prevent disconnection
  // Use CSS to show/hide instead of conditional rendering
  return (
    <div className="space-y-4">
      {/* Live indicator and controls */}
      {isLive && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-bold">AO VIVO</span>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'broadcaster' ? (
              <button
                onClick={() => setViewMode('viewer')}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
              >
                <Monitor className="w-4 h-4 inline mr-2" />
                Ver como espectador
              </button>
            ) : (
              <button
                onClick={() => setViewMode('broadcaster')}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Ver Preview
              </button>
            )}
            <button
              onClick={handleEndLive}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
            >
              Encerrar Live
            </button>
          </div>
        </div>
      )}

      {/* WebBroadcaster - ALWAYS rendered, hidden when viewing as spectator */}
      <div className={viewMode === 'viewer' && isLive ? 'hidden' : ''}>
        <WebBroadcaster
          token={token}
          wsUrl={wsUrl}
          roomName={stream.livekit_room_name}
          onGoLive={handleGoLive}
          onEndLive={handleEndLive}
          isLive={isLive}
          isStarting={isStarting}
        />
      </div>

      {/* LivePlayer - only shown when viewing as spectator */}
      {viewMode === 'viewer' && isLive && stream.mux_playback_id && (
        <div className="relative">
          <div className="absolute top-4 left-4 z-10 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            <Monitor className="w-3 h-3 inline mr-1" />
            Visualizacao do espectador
          </div>
          <LivePlayer
            stream={{
              ...stream,
              status: 'LIVE'
            } as any}
            isPastor={true}
          />
        </div>
      )}
    </div>
  )
}
