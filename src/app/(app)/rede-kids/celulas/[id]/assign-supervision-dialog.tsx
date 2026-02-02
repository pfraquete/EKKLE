'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, X, UserPlus } from 'lucide-react'
import { assignCellSupervision, removeCellSupervision, AvailableDiscipuladora } from '@/actions/kids-cells'

interface Supervision {
  id: string
  discipuladora_id: string
  discipuladora: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    photo_url: string | null
  } | null
}

interface AssignSupervisionDialogProps {
  cellId: string
  currentSupervision: Supervision | null
  availableDiscipuladoras: AvailableDiscipuladora[]
}

export function AssignSupervisionDialog({
  cellId,
  currentSupervision,
  availableDiscipuladoras
}: AssignSupervisionDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDiscipuladora, setSelectedDiscipuladora] = useState(
    currentSupervision?.discipuladora_id || ''
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)

    startTransition(async () => {
      try {
        if (selectedDiscipuladora) {
          await assignCellSupervision(cellId, selectedDiscipuladora)
        } else if (currentSupervision) {
          await removeCellSupervision(cellId)
        }
        setIsOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar supervisão')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title={currentSupervision ? 'Alterar supervisão' : 'Atribuir supervisão'}
      >
        {currentSupervision ? (
          <Shield className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Supervisão da Célula</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Selecione uma Discipuladora Kids para supervisionar esta célula.
              Cada discipuladora pode supervisionar no máximo 5 células.
            </p>

            <select
              value={selectedDiscipuladora}
              onChange={(e) => setSelectedDiscipuladora(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            >
              <option value="">Sem supervisão</option>
              {availableDiscipuladoras.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.full_name} ({disc.supervision_count}/5 células)
                </option>
              ))}
              {/* Include current supervision if not in available list */}
              {currentSupervision?.discipuladora &&
                !availableDiscipuladoras.find(d => d.id === currentSupervision.discipuladora_id) && (
                <option value={currentSupervision.discipuladora_id}>
                  {currentSupervision.discipuladora.full_name} (atual)
                </option>
              )}
            </select>

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
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
