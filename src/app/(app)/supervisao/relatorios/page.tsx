import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getDiscipuladorDashboardData } from '@/actions/discipulador'
import {
  FileText,
  ArrowLeft,
  Download,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

export default async function RelatoriosPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'DISCIPULADOR') {
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

  // Calculate stats
  const cellsWithReport = data.supervisedCells.filter(c => c.hasRecentReport).length
  const totalCells = data.supervisedCells.length
  const reportRate = totalCells > 0 ? Math.round((cellsWithReport / totalCells) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/supervisao"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Relatorios</h1>
            <p className="text-muted-foreground mt-1">
              Resumo das celulas supervisionadas
            </p>
          </div>
        </div>

        {/* Export Button (placeholder) */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium opacity-50 cursor-not-allowed"
          title="Em breve"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Taxa de Relatorios
            </span>
            <div className={`p-2 rounded-xl ${
              reportRate >= 80 ? 'bg-green-500/10 text-green-600' :
              reportRate >= 50 ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-red-500/10 text-red-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{reportRate}%</p>
          <p className="text-sm text-muted-foreground">
            {cellsWithReport} de {totalCells} celulas
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Presenca Media
            </span>
            <div className={`p-2 rounded-xl ${
              data.stats.overallAttendance >= 70 ? 'bg-green-500/10 text-green-600' :
              data.stats.overallAttendance >= 50 ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-red-500/10 text-red-500'
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{data.stats.overallAttendance}%</p>
          <p className="text-sm text-muted-foreground">
            ultimas reunioes
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Total de Membros
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{data.stats.totalMembers}</p>
          <p className="text-sm text-muted-foreground">
            em {data.stats.totalSupervisedCells} celulas
          </p>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">Detalhamento por Celula</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Celula
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Lider
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                  Membros
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                  Presenca
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                  Relatorio
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.supervisedCells.map((cell) => (
                <tr key={cell.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/supervisao/celulas/${cell.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {cell.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {cell.leaderName}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {cell.membersCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${
                        cell.avgAttendance >= 70 ? 'text-green-600' :
                        cell.avgAttendance >= 50 ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {cell.avgAttendance}%
                      </span>
                      {cell.avgAttendance >= 70 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : cell.avgAttendance < 50 ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cell.hasRecentReport ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cell.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {cell.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.supervisedCells.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhuma celula para gerar relatorio
            </p>
          </div>
        )}
      </div>

      {/* Generated Date */}
      <div className="text-center text-sm text-muted-foreground">
        <Calendar className="w-4 h-4 inline mr-1" />
        Relatorio gerado em {new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}
