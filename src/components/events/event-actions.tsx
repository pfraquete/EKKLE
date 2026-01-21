'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '@/actions/events'
import { Trash2, Loader2 } from 'lucide-react'

type EventActionsProps = {
  eventId: string
  canDelete: boolean
}

export function EventActions({ eventId, canDelete }: EventActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!canDelete) return null

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteEvent(eventId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Excluir evento"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  )
}
