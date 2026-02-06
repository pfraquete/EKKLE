import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { getDiscipuladorDashboardData } from '@/actions/discipulador'
import {
  Users,
  BarChart3,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function SupervisaoPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'DISCIPULADOR') {
    redirect('/dashboard')
  }

  if (!(await isModuleEnabled('cells'))) {
    redirect('/dashboard')
  }

  const data = await getDiscipuladorDashboardData()

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Supervisao</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas celulas e lideres
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Celulas Supervisionadas"
          value={data.stats.totalSupervisedCells}
          subtitle={`de 5 maximo`}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total de Membros"
          value={data.stats.totalMembers}
          subtitle="nas celulas"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Presenca Media"
          value={`${data.stats.overallAttendance}%`}
          subtitle="ultimas reunioes"
          icon={<BarChart3 className="w-5 h-5" />}
          color={data.stats.overallAttendance >= 70 ? 'green' : data.stats.overallAttendance >= 50 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Sem Relatorio"
          value={data.stats.cellsWithoutReports}
          subtitle="celulas"
          icon={<FileText className="w-5 h-5" />}
          color={data.stats.cellsWithoutReports > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Alerts Section */}
      {data.recentAlerts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-yellow-600" />
            <h2 className="font-bold text-yellow-600">Alertas</h2>
          </div>
          <div className="space-y-3">
            {data.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-yellow-500/5 border border-yellow-500/10'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <Link
                    href={`/supervisao/celulas/${alert.cellId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver celula
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervised Cells */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">Celulas Supervisionadas</h2>
        </div>

        <div className="divide-y divide-border">
          {data.supervisedCells.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhuma celula atribuida ainda
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                O pastor precisa atribuir celulas para voce supervisionar
              </p>
            </div>
          ) : (
            data.supervisedCells.map((cell) => (
              <Link
                key={cell.id}
                href={`/supervisao/celulas/${cell.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Leader Avatar */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {cell.leaderPhotoUrl ? (
                    <Image
                      src={cell.leaderPhotoUrl}
                      alt={cell.leaderName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Cell Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{cell.name}</h3>
                    {cell.status === 'INACTIVE' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    Lider: {cell.leaderName}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{cell.membersCount}</p>
                    <p className="text-xs text-muted-foreground">membros</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold ${
                      cell.avgAttendance >= 70 ? 'text-green-600' :
                      cell.avgAttendance >= 50 ? 'text-yellow-600' :
                      'text-red-500'
                    }`}>
                      {cell.avgAttendance}%
                    </p>
                    <p className="text-xs text-muted-foreground">presenca</p>
                  </div>
                  <div className="text-center">
                    {cell.hasRecentReport ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                    <p className="text-xs text-muted-foreground">relatorio</p>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2">
                  {cell.leaderPhone && (
                    <a
                      href={`https://wa.me/${cell.leaderPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                      title="WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {cell.leaderEmail && (
                    <a
                      href={`mailto:${cell.leaderEmail}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      title="Email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Pending Requests */}
      {data.stats.pendingRequests > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Solicitacoes Pendentes</h3>
                <p className="text-sm text-muted-foreground">
                  {data.stats.pendingRequests} {data.stats.pendingRequests === 1 ? 'solicitacao' : 'solicitacoes'} aguardando aprovacao
                </p>
              </div>
            </div>
            <Link
              href="/supervisao/solicitacoes"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: 'primary' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600',
    yellow: 'bg-yellow-500/10 text-yellow-600',
    red: 'bg-red-500/10 text-red-500'
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
