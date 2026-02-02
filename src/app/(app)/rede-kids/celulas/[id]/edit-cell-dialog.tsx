'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, X } from 'lucide-react'
import { updateKidsCell, KidsCell } from '@/actions/kids-cells'

interface EditCellDialogProps {
  cell: KidsCell
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export function EditCellDialog({ cell }: EditCellDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: cell.name,
    status: cell.status,
    dayOfWeek: cell.day_of_week?.toString() || '',
    meetingTime: cell.meeting_time?.slice(0, 5) || '',
    address: cell.address || '',
    neighborhood: cell.neighborhood || '',
    ageRangeMin: cell.age_range_min,
    ageRangeMax: cell.age_range_max,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        await updateKidsCell({
          id: cell.id,
          name: formData.name,
          status: formData.status as 'ACTIVE' | 'INACTIVE',
          dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null,
          meetingTime: formData.meetingTime || null,
          address: formData.address || null,
          neighborhood: formData.neighborhood || null,
          ageRangeMin: formData.ageRangeMin,
          ageRangeMax: formData.ageRangeMax,
        })
        setIsOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar célula')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        <Edit className="h-4 w-4" />
        Editar
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Editar Célula</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome da Célula
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="INACTIVE">Inativa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium mb-2">
                    Dia da Semana
                  </label>
                  <select
                    id="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Não definido</option>
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="meetingTime" className="block text-sm font-medium mb-2">
                    Horário
                  </label>
                  <input
                    id="meetingTime"
                    type="time"
                    value={formData.meetingTime}
                    onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-2">
                  Endereço
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium mb-2">
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ageRangeMin" className="block text-sm font-medium mb-2">
                    Idade Mínima
                  </label>
                  <input
                    id="ageRangeMin"
                    type="number"
                    min="0"
                    max="18"
                    value={formData.ageRangeMin}
                    onChange={(e) => setFormData({ ...formData, ageRangeMin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="ageRangeMax" className="block text-sm font-medium mb-2">
                    Idade Máxima
                  </label>
                  <input
                    id="ageRangeMax"
                    type="number"
                    min="0"
                    max="18"
                    value={formData.ageRangeMax}
                    onChange={(e) => setFormData({ ...formData, ageRangeMax: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
