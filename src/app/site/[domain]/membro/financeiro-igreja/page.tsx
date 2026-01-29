import { getProfile } from '@/actions/auth'
import { isInFinanceTeam } from '@/actions/finance-team'
import { getAllTithes, getTitheSummary } from '@/actions/tithes'
import { getAllCellBalances } from '@/actions/cell-offerings'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Landmark,
    HandCoins,
    Users,
    Wallet,
    ArrowRight,
    TrendingUp,
    CheckCircle,
    Clock
} from 'lucide-react'

export default async function FinanceiroIgrejaPage() {
    const profile = await getProfile()

    if (!profile) {
        redirect('/entrar')
    }

    // Check if user is in finance team
    const financeCheck = await isInFinanceTeam()
    if (!financeCheck.isInTeam) {
        redirect('/membro')
    }

    // Get current month/year
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Get summary data
    const [titheSummary, cellBalances] = await Promise.all([
        getTitheSummary(currentMonth, currentYear),
        getAllCellBalances(),
    ])

    const pendingTithes = titheSummary.success ? titheSummary.data?.countPending || 0 : 0
    const confirmedTithes = titheSummary.success ? titheSummary.data?.countConfirmed || 0 : 0
    const totalTithes = titheSummary.success ? (titheSummary.data?.totalConfirmed || 0) + (titheSummary.data?.totalPending || 0) : 0
    const totalCellBalance = cellBalances.success ? cellBalances.data?.total_cents || 0 : 0
    const cellCount = cellBalances.success ? cellBalances.data?.cells?.length || 0 : 0

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100)
    }

    const getMonthName = (month: number) => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        return months[month - 1]
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <Landmark className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground mb-2">
                        Financeiro da Igreja
                    </h1>
                    <p className="text-muted-foreground">
                        Painel de gestão financeira
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tithes This Month */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-500/10">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                                Dízimos {getMonthName(currentMonth)}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            {formatCurrency(totalTithes)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {confirmedTithes} confirmados
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {pendingTithes} pendentes
                            </span>
                        </div>
                    </div>

                    {/* Cell Balances */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-500/10">
                                <Wallet className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                                Caixa das Células
                            </span>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            {formatCurrency(totalCellBalance)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {cellCount} {cellCount === 1 ? 'célula' : 'células'} com saldo
                        </p>
                    </div>

                    {/* Pending Actions */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-amber-500/10">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                                Pendências
                            </span>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            {pendingTithes}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            comprovantes para confirmar
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Confirm Tithes */}
                    <Link
                        href="/membro/financeiro-igreja/dizimos"
                        className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                <HandCoins className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Dízimos</h3>
                                <p className="text-sm text-muted-foreground">
                                    Confirmar comprovantes
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    {/* View Cell Balances */}
                    <Link
                        href="/membro/financeiro-igreja/celulas"
                        className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Células</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ver caixa de cada célula
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-2">
                        Suas permissões
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Visualizar e confirmar dízimos dos membros</li>
                        <li>• Ver o caixa de todas as células</li>
                        <li>• Acessar relatórios financeiros</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
