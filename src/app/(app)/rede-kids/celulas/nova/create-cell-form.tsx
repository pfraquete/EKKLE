'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createKidsCell, AvailableKidsLeader } from '@/actions/kids-cells'

interface CreateCellFormProps {
  availableLeaders: AvailableKidsLeader[]
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

export function CreateCellForm({ availableLeaders }: CreateCellFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    leaderId: '',
    dayOfWeek: '',
    meetingTime: '',
    address: '',
    neighborhood: '',
    ageRangeMin: 0,
    ageRangeMax: 12,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        await createKidsCell({
          name: formData.name,
          leaderId: formData.leaderId || null,
          dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null,
          meetingTime: formData.meetingTime || null,
          address: formData.address || null,
          neighborhood: formData.neighborhood || null,
          ageRangeMin: formData.ageRangeMin,
          ageRangeMax: formData.ageRangeMax,
        })
        router.push('/rede-kids/celulas')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar célula')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da Célula */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Nome da Célula *
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Célula Kids Centro"
          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Líder */}
      <div>
        <label htmlFor="leader" className="block text-sm font-medium mb-2">
          Líder
        </label>
        <select
          id="leader"
          value={formData.leaderId}
          onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecionar depois</option>
          {availableLeaders.map((leader) => (
            <option key={leader.id} value={leader.id}>
              {leader.full_name}
            </option>
          ))}
        </select>
        {availableLeaders.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Não há líderes kids disponíveis. Adicione membros com função "Líder Kids" primeiro.
          </p>
        )}
      </div>

      {/* Dia e Horário */}
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

      {/* Endereço */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-2">
          Endereço
        </label>
        <input
          id="address"
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rua, número"
          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bairro */}
      <div>
        <label htmlFor="neighborhood" className="block text-sm font-medium mb-2">
          Bairro
        </label>
        <input
          id="neighborhood"
          type="text"
          value={formData.neighborhood}
          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
          placeholder="Nome do bairro"
          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Faixa Etária */}
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

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !formData.name}
          className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Criando...' : 'Criar Célula'}
        </button>
      </div>
    </form>
  )
}
