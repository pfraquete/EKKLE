'use client'

import { useState } from 'react'
import { addSupervisionNote } from '@/actions/discipulador'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AddNoteFormProps {
  cellId: string
}

export function AddNoteForm({ cellId }: AddNoteFormProps) {
  const [note, setNote] = useState('')
  const [noteType, setNoteType] = useState<'FEEDBACK' | 'CONCERN' | 'PRAISE' | 'ACTION_ITEM'>('FEEDBACK')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!note.trim()) {
      toast.error('Digite uma anotacao')
      return
    }

    setIsLoading(true)

    try {
      await addSupervisionNote(cellId, note, noteType, isPrivate)
      toast.success('Anotacao adicionada')
      setNote('')
      setNoteType('FEEDBACK')
      setIsPrivate(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar anotacao')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Tipo
        </label>
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value as typeof noteType)}
          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
          disabled={isLoading}
        >
          <option value="FEEDBACK">Feedback</option>
          <option value="PRAISE">Elogio</option>
          <option value="CONCERN">Preocupacao</option>
          <option value="ACTION_ITEM">Item de Acao</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Anotacao
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Digite sua anotacao..."
          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm min-h-[100px] resize-none"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPrivate"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          disabled={isLoading}
          className="rounded border-border"
        />
        <label htmlFor="isPrivate" className="text-sm text-muted-foreground">
          Anotacao privada (so voce vera)
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !note.trim()}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : (
          'Adicionar Anotacao'
        )}
      </button>
    </form>
  )
}
