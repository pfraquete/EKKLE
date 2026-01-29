import { getProfile } from '@/actions/auth'
import { isInFinanceTeam } from '@/actions/finance-team'
import { getAllCellBalances } from '@/actions/cell-offerings'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeft,
    Users,
    Wallet,
    TrendingUp
} from 'lucide-react'

export default async function FinanceiroCelulasPage() {
    const profile = await getProfile()

    if (!profile) {
        redirect('/entrar')
    }

    // Check if user is in finance team
    const financeCheck = await isInFinanceTeam()
    if (!financeCheck.isInTeam) {
        redirect('/membro')
    }

    // Get all cell balances
    const balancesResult = await getAllCellBalances()
    const cells = balancesResult.success ? balancesResult.data?.cells || [] : []
    const totalBalance = balancesResult.success ? balancesResult.data?.total_cents || 0 : 0

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100)
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href="/membro/financeiro-igreja"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground">
                                Caixa das Células
                            </h1>
                            <p className="text-muted-foreground">
                                Saldo de cada célula da igreja
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                Total em Todas as Células
                            </p>
                            <p className="text-3xl font-black text-foreground">
                                {formatCurrency(totalBalance)}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary/10">
                            <Wallet className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/20">
                        <p className="text-sm text-muted-foreground">
                            {cells.length} {cells.length === 1 ? 'célula' : 'células'} cadastradas
                        </p>
                    </div>
                </div>

                {/* Cells List */}
                {cells.length > 0 ? (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="font-bold text-foreground">
                                Células por Saldo
                            </h3>
                        </div>
                        <div className="divide-y divide-border">
                            {cells.map((cellBalance: any) => (
                                <div
                                    key={cellBalance.id}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                                            {cellBalance.cell?.leader?.photo_url ? (
                                                <Image
                                                    src={cellBalance.cell.leader.photo_url}
                                                    alt={cellBalance.cell.leader.full_name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">
                                                {cellBalance.cell?.name || 'Célula'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Líder: {cellBalance.cell?.leader?.full_name || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${
                                            cellBalance.balance_cents > 0
                                                ? 'text-emerald-500'
                                                : 'text-muted-foreground'
                                        }`}>
                                            {formatCurrency(cellBalance.balance_cents)}
                                        </p>
                                        {cellBalance.balance_cents > 0 && (
                                            <div className="flex items-center justify-end gap-1 text-xs text-emerald-500">
                                                <TrendingUp className="w-3 h-3" />
                                                <span>ativo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Nenhuma célula com caixa
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            As células ainda não possuem ofertas registradas
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
