import { getAllTithes, getTitheSummary } from '@/actions/tithes'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeft,
    Heart,
    CheckCircle,
    Clock,
    Eye,
    Users,
    TrendingUp,
    Search
} from 'lucide-react'
import { TitheConfirmButton } from '@/components/tithe/tithe-confirm-button'

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface PageProps {
    searchParams: Promise<{ month?: string; status?: string }>
}

export default async function DashboardDizimosPage({ searchParams }: PageProps) {
    const profile = await getProfile()

    if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) {
        redirect('/dashboard')
    }

    const params = await searchParams
    const currentYear = new Date().getFullYear()
    const currentMonth = params.month ? parseInt(params.month) : new Date().getMonth() + 1
    const statusFilter = params.status as 'PENDING' | 'CONFIRMED' | undefined

    // Fetch data
    const [tithesResult, summaryResult] = await Promise.all([
        getAllTithes({
            year: currentYear,
            month: currentMonth,
            status: statusFilter,
        }),
        getTitheSummary(currentYear, currentMonth),
    ])

    const tithes = tithesResult.success ? tithesResult.data || [] : []
    const summary = summaryResult.success && summaryResult.data ? summaryResult.data : {
        totalConfirmed: 0,
        totalPending: 0,
        countConfirmed: 0,
        countPending: 0,
    } as const

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link
                        href="/dashboard/financeiro"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Dízimos</h1>
                    <p className="text-muted-foreground">
                        Gerencie os dízimos dos membros - {MONTHS[currentMonth - 1]} {currentYear}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Confirmados</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(summary.totalConfirmed / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.countConfirmed} membro{summary.countConfirmed !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Pendentes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(summary.totalPending / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.countPending} membro{summary.countPending !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                        {formatCurrency((summary.totalConfirmed + summary.totalPending) / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-200/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Dizimistas</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        {summary.countConfirmed + summary.countPending}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Registros este mês</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    defaultValue={currentMonth}
                    onChange={(e) => {
                        const url = new URL(window.location.href)
                        url.searchParams.set('month', e.target.value)
                        window.location.href = url.toString()
                    }}
                    className="h-10 px-4 rounded-lg bg-background border border-border text-foreground text-sm"
                >
                    {MONTHS.map((month, index) => (
                        <option key={index} value={index + 1}>
                            {month}
                        </option>
                    ))}
                </select>

                <div className="flex rounded-lg border border-border overflow-hidden">
                    <Link
                        href={`/dashboard/financeiro/dizimos?month=${currentMonth}`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            !statusFilter ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Todos
                    </Link>
                    <Link
                        href={`/dashboard/financeiro/dizimos?month=${currentMonth}&status=PENDING`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            statusFilter === 'PENDING' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Pendentes
                    </Link>
                    <Link
                        href={`/dashboard/financeiro/dizimos?month=${currentMonth}&status=CONFIRMED`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            statusFilter === 'CONFIRMED' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Confirmados
                    </Link>
                </div>
            </div>

            {/* Tithes Table */}
            {tithes.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhum dízimo registrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Não há dízimos {statusFilter === 'PENDING' ? 'pendentes' : statusFilter === 'CONFIRMED' ? 'confirmados' : ''} para {MONTHS[currentMonth - 1]}
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Membro
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Valor
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Comprovante
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Ação
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tithes.map((tithe: any) => (
                                <tr key={tithe.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted/30 flex-shrink-0">
                                                {tithe.profile?.photo_url ? (
                                                    <Image
                                                        src={tithe.profile.photo_url}
                                                        alt={tithe.profile.full_name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                                        {(tithe.profile?.full_name || 'A')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    {tithe.profile?.full_name || 'Membro'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {tithe.profile?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-foreground">
                                            {formatCurrency(tithe.amount_cents / 100)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tithe.status === 'CONFIRMED' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Confirmado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold">
                                                <Clock className="w-3.5 h-3.5" />
                                                Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tithe.receipt_url ? (
                                            <a
                                                href={tithe.receipt_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Ver
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tithe.status === 'PENDING' && (
                                            <TitheConfirmButton titheId={tithe.id} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
