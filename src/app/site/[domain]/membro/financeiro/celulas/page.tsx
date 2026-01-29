import { getAllCellBalances } from '@/actions/cell-offerings'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    Building2,
} from 'lucide-react'

export default async function MemberCelulasFinanceiroPage() {
    const profile = await getProfile()

    if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) {
        redirect('/membro')
    }

    const result = await getAllCellBalances()

    if (!result.success) {
        return (
            <div className="p-6">
                <p className="text-destructive">Erro ao carregar dados</p>
            </div>
        )
    }

    const { cells, total_cents } = result.data!

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
                <h1 className="text-2xl font-black text-foreground">Caixa das Células</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Saldo de cada célula • Ekkle
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                            Total em Células
                        </p>
                        <p className="text-3xl font-black text-foreground">
                            {formatCurrency(total_cents / 100)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-3">
                <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Building2 className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Células</span>
                    </div>
                    <p className="text-xl font-black text-foreground">{cells.length}</p>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Média</span>
                    </div>
                    <p className="text-xl font-black text-foreground">
                        {formatCurrency(cells.length > 0 ? (total_cents / cells.length) / 100 : 0)}
                    </p>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <Wallet className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Com Saldo</span>
                    </div>
                    <p className="text-xl font-black text-foreground">
                        {cells.filter((c: any) => c.balance_cents > 0).length}
                    </p>
                </div>
            </div>

            {/* Cells List */}
            {cells.length === 0 ? (
                <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhuma célula encontrada
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Crie células para começar a registrar ofertas
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-border">
                        {cells.map((cellBalance: any) => (
                            <div key={cellBalance.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {cellBalance.cell?.name || 'Célula'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted/30 flex-shrink-0">
                                                {cellBalance.cell?.leader?.photo_url ? (
                                                    <Image
                                                        src={cellBalance.cell.leader.photo_url}
                                                        alt={cellBalance.cell.leader.full_name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[8px] font-bold">
                                                        {(cellBalance.cell?.leader?.full_name || 'L')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {cellBalance.cell?.leader?.full_name || 'Sem líder'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`font-black text-lg ${
                                    cellBalance.balance_cents > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                                }`}>
                                    {formatCurrency(cellBalance.balance_cents / 100)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
