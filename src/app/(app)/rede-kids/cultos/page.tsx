import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsWorshipServices, getKidsWorshipStats } from '@/actions/kids-worship'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Baby,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  ChevronRight,
} from 'lucide-react'

export default async function CultosKidsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only Pastor or Kids Network members can access
  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    redirect('/dashboard')
  }

  const services = await getKidsWorshipServices()
  const stats = await getKidsWorshipStats()

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
  const canManage = isPastor || isPastoraKids || isDiscipuladoraKids

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Agendado
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
            <PlayCircle className="w-3 h-3" />
            Em andamento
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-500 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Concluído
          </span>
        )
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/rede-kids"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cultos Kids</h1>
            <p className="text-muted-foreground">
              Cultos gerais para todas as crianças da igreja
            </p>
          </div>
        </div>
        {canManage && (
          <Link
            href="/rede-kids/cultos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Culto
          </Link>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Baby className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgKidsPresent}</p>
                <p className="text-xs text-muted-foreground">Média crianças</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Todos os Cultos</h2>
        </div>

        {services.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum culto kids cadastrado</p>
            <p className="text-sm mt-1">Crie o primeiro culto kids para começar</p>
            {canManage && (
              <Link
                href="/rede-kids/cultos/novo"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar Culto
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/rede-kids/cultos/${service.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.title}</p>
                      {getStatusBadge(service.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(service.service_date)}</span>
                      {service.service_time && (
                        <span>• {service.service_time.slice(0, 5)}</span>
                      )}
                      {service.theme && (
                        <span>• {service.theme}</span>
                      )}
                    </div>
                    {service.status === 'COMPLETED' && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Baby className="w-3 h-3" />
                          {service.kids_present} crianças
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {service.volunteers_present} voluntários
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
