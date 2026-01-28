'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square, Loader2, Radio, MessageSquare, MessageSquareOff } from 'lucide-react'
import {
  startLiveStream,
  endLiveStream,
  toggleStreamChat,
  LiveStreamStatus,
} from '@/actions/live-streams'
import { toast } from 'sonner'

type LiveStreamControlsProps = {
  streamId: string
  status: LiveStreamStatus
}

export function LiveStreamControls({ streamId, status }: LiveStreamControlsProps) {
  const [loading, setLoading] = useState(false)
  const [chatToggling, setChatToggling] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    const result = await startLiveStream(streamId)
    setLoading(false)

    if (result.success) {
      toast.success('Transmissao iniciada!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao iniciar transmissao')
    }
  }

  const handleEnd = async () => {
    if (!confirm('Tem certeza que deseja encerrar esta transmissao?')) return

    setLoading(true)
    const result = await endLiveStream(streamId)
    setLoading(false)

    if (result.success) {
      toast.success('Transmissao encerrada!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao encerrar transmissao')
    }
  }

  const handleToggleChat = async () => {
    setChatToggling(true)
    const result = await toggleStreamChat(streamId)
    setChatToggling(false)

    if (result.success) {
      toast.success(result.chatEnabled ? 'Chat habilitado!' : 'Chat desabilitado!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao alterar chat')
    }
  }

  if (status === 'SCHEDULED') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleStart}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Iniciar Live
            </>
          )}
        </button>
      </div>
    )
  }

  if (status === 'LIVE') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleChat}
          disabled={chatToggling}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors text-sm"
          title="Alternar chat"
        >
          {chatToggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-600 rounded-lg text-sm font-bold">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          AO VIVO
        </div>

        <button
          onClick={handleEnd}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Encerrando...
            </>
          ) : (
            <>
              <Square className="w-5 h-5" />
              Encerrar Live
            </>
          )}
        </button>
      </div>
    )
  }

  // ENDED or CANCELLED
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">
      {status === 'ENDED' ? 'Transmissao encerrada' : 'Transmissao cancelada'}
    </div>
  )
}
