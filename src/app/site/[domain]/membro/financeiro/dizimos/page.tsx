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
} from 'lucide-react'
import { TitheConfirmButton } from '@/components/tithe/tithe-confirm-button'
import { MonthSelect } from '@/components/tithe/month-select'

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface PageProps {
    searchParams: Promise<{ month?: string; status?: string }>
}

export default async function MemberDizimosPage({ searchParams }: PageProps) {
    const profile = await getProfile()

    if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) {
        redirect('/membro')
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
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <Link
                    href="/membro/financeiro"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-black text-foreground">Dízimos</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    {MONTHS[currentMonth - 1]} {currentYear} • Ekkle
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Confirmados</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600">
                        {formatCurrency(summary.totalConfirmed / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.countConfirmed} membro{summary.countConfirmed !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10">
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Pendentes</span>
                    </div>
                    <p className="text-xl font-black text-amber-600">
                        {formatCurrency(summary.totalPending / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.countPending} membro{summary.countPending !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Total</span>
                    </div>
                    <p className="text-xl font-black text-primary">
                        {formatCurrency((summary.totalConfirmed + summary.totalPending) / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-200/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <Users className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Dizimistas</span>
                    </div>
                    <p className="text-xl font-black text-purple-600">
                        {summary.countConfirmed + summary.countPending}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Registros</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <MonthSelect currentMonth={currentMonth} />

                <div className="flex rounded-xl border border-border overflow-hidden">
                    <Link
                        href={`/membro/financeiro/dizimos?month=${currentMonth}`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            !statusFilter ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Todos
                    </Link>
                    <Link
                        href={`/membro/financeiro/dizimos?month=${currentMonth}&status=PENDING`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            statusFilter === 'PENDING' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Pendentes
                    </Link>
                    <Link
                        href={`/membro/financeiro/dizimos?month=${currentMonth}&status=CONFIRMED`}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            statusFilter === 'CONFIRMED' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                        }`}
                    >
                        Confirmados
                    </Link>
                </div>
            </div>

            {/* Tithes List */}
            {tithes.length === 0 ? (
                <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhum dízimo registrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Não há dízimos {statusFilter === 'PENDING' ? 'pendentes' : statusFilter === 'CONFIRMED' ? 'confirmados' : ''} para {MONTHS[currentMonth - 1]}
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-border">
                        {tithes.map((tithe: any) => (
                            <div key={tithe.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
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
                                            {formatCurrency(tithe.amount_cents / 100)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {tithe.receipt_url && (
                                        <a
                                            href={tithe.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </a>
                                    )}
                                    {tithe.status === 'CONFIRMED' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Confirmado
                                        </span>
                                    ) : (
                                        <TitheConfirmButton titheId={tithe.id} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
