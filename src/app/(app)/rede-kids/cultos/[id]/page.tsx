import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsWorshipService } from '@/actions/kids-worship'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Users,
  Baby,
  UserPlus,
  CheckCircle,
  XCircle,
  PlayCircle,
  Edit,
} from 'lucide-react'
import { WorshipServiceActions } from '@/components/rede-kids/worship-service-actions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function CultoKidsPage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only Pastor or Kids Network members can access
  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    redirect('/dashboard')
  }

  const service = await getKidsWorshipService(id)
  if (!service) {
    notFound()
  }

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
  const canManage = isPastor || isPastoraKids || isDiscipuladoraKids

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 text-sm font-medium rounded-full">
            <Clock className="w-4 h-4" />
            Agendado
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 text-sm font-medium rounded-full">
            <PlayCircle className="w-4 h-4" />
            Em andamento
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500/10 text-gray-500 text-sm font-medium rounded-full">
            <CheckCircle className="w-4 h-4" />
            Concluído
          </span>
        )
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 text-sm font-medium rounded-full">
            <XCircle className="w-4 h-4" />
            Cancelado
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/rede-kids/cultos"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{service.title}</h1>
              {getStatusBadge(service.status)}
            </div>
            <p className="text-muted-foreground">
              {formatDate(service.service_date)}
              {service.service_time && ` às ${service.service_time.slice(0, 5)}`}
            </p>
          </div>
        </div>
        {canManage && service.status !== 'COMPLETED' && service.status !== 'CANCELED' && (
          <WorshipServiceActions serviceId={service.id} status={service.status} />
        )}
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações
            </h2>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(service.service_date)}</p>
                </div>
              </div>

              {service.service_time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{service.service_time.slice(0, 5)}</p>
                  </div>
                </div>
              )}

              {service.theme && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tema</p>
                    <p className="font-medium">{service.theme}</p>
                  </div>
                </div>
              )}

              {service.bible_verse && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Versículo</p>
                    <p className="font-medium">{service.bible_verse}</p>
                  </div>
                </div>
              )}

              {service.description && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{service.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes (if completed) */}
          {service.status === 'COMPLETED' && service.notes && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-semibold mb-3">Observações</h2>
              <p className="text-sm text-muted-foreground">{service.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance Stats (if completed) */}
          {service.status === 'COMPLETED' && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Presença</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-amber-500" />
                    <span>Crianças</span>
                  </div>
                  <span className="font-bold text-lg">{service.kids_present}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Voluntários</span>
                  </div>
                  <span className="font-bold text-lg">{service.volunteers_present}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-500" />
                    <span>Visitantes</span>
                  </div>
                  <span className="font-bold text-lg">{service.visitors_count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Creator Info */}
          {service.creator && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-semibold mb-3">Criado por</h2>
              <p className="text-sm text-muted-foreground">{service.creator.full_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
