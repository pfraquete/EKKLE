'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Play, Square, Trash2, Edit } from 'lucide-react'
import {
  startLiveStream,
  endLiveStream,
  deleteLiveStream,
  LiveStreamStatus,
} from '@/actions/live-streams'
import { toast } from 'sonner'

type LiveStreamActionsProps = {
  streamId: string
  status: LiveStreamStatus
}

export function LiveStreamActions({ streamId, status }: LiveStreamActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    const result = await startLiveStream(streamId)
    setLoading(false)
    setMenuOpen(false)

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
    setMenuOpen(false)

    if (result.success) {
      toast.success('Transmissao encerrada!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao encerrar transmissao')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta transmissao? Esta acao nao pode ser desfeita.')) return

    setLoading(true)
    const result = await deleteLiveStream(streamId)
    setLoading(false)
    setMenuOpen(false)

    if (result.success) {
      toast.success('Transmissao excluida!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao excluir transmissao')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        disabled={loading}
      >
        <MoreVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
            {status === 'SCHEDULED' && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-green-600"
              >
                <Play className="w-4 h-4" />
                Iniciar Live
              </button>
            )}

            {status === 'LIVE' && (
              <button
                onClick={handleEnd}
                disabled={loading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-orange-600"
              >
                <Square className="w-4 h-4" />
                Encerrar Live
              </button>
            )}

            {(status === 'SCHEDULED' || status === 'ENDED' || status === 'CANCELLED') && (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(`/dashboard/lives/${streamId}/editar`)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
