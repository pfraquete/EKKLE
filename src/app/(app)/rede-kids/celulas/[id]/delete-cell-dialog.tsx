'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { deleteKidsCell } from '@/actions/kids-cells'

interface DeleteCellDialogProps {
  cellId: string
  cellName: string
}

export function DeleteCellDialog({ cellId, cellName }: DeleteCellDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)

    startTransition(async () => {
      try {
        await deleteKidsCell(cellId)
        router.push('/rede-kids/celulas')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir célula')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Excluir Célula</h2>
                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="mb-6">
              Tem certeza que deseja excluir a célula <strong>{cellName}</strong>?
              Todos os membros serão removidos desta célula.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-6 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
