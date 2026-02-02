import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsCellsWithStats } from '@/actions/kids-cells'
import Link from 'next/link'
import {
  Home,
  Plus,
  ArrowLeft,
  Users,
  Baby,
  MapPin,
  Clock
} from 'lucide-react'

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function RedeKidsCelulasPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    redirect('/dashboard')
  }

  const cells = await getKidsCellsWithStats()

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const canCreate = isPastor || isPastoraKids

  const activeCells = cells.filter(c => c.status === 'ACTIVE')
  const inactiveCells = cells.filter(c => c.status === 'INACTIVE')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/rede-kids"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Células Kids</h1>
            <p className="text-muted-foreground">
              {cells.length} célula{cells.length !== 1 ? 's' : ''} cadastrada{cells.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {canCreate && (
          <Link
            href="/rede-kids/celulas/nova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Célula
          </Link>
        )}
      </div>

      {/* Active Cells */}
      <section>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Células Ativas ({activeCells.length})
        </h2>
        {activeCells.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhuma célula kids ativa</p>
            {canCreate && (
              <Link
                href="/rede-kids/celulas/nova"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar primeira célula
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCells.map((cell) => (
              <Link
                key={cell.id}
                href={`/rede-kids/celulas/${cell.id}`}
                className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{cell.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cell.leader?.full_name || 'Sem líder definido'}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded">
                    Ativa
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {cell.day_of_week !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {DAYS_OF_WEEK[cell.day_of_week]}
                      {cell.meeting_time && ` às ${cell.meeting_time.slice(0, 5)}`}
                    </div>
                  )}
                  {cell.neighborhood && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {cell.neighborhood}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{cell.members_count} membros</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Baby className="h-4 w-4 text-amber-500" />
                      <span>{cell.children_count} crianças</span>
                    </div>
                  </div>
                  {cell.age_range_min !== null && cell.age_range_max !== null && (
                    <div className="text-xs text-muted-foreground">
                      Faixa etária: {cell.age_range_min} - {cell.age_range_max} anos
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Inactive Cells */}
      {inactiveCells.length > 0 && (
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            Células Inativas ({inactiveCells.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {inactiveCells.map((cell) => (
              <Link
                key={cell.id}
                href={`/rede-kids/celulas/${cell.id}`}
                className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{cell.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cell.leader?.full_name || 'Sem líder definido'}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-gray-500/10 text-gray-600 text-xs font-medium rounded">
                    Inativa
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{cell.members_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Baby className="h-4 w-4 text-amber-500" />
                    <span>{cell.children_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
