import { getProfile } from '@/actions/auth'
import { isInFinanceTeam } from '@/actions/finance-team'
import { getAllTithes } from '@/actions/tithes'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeft,
    HandCoins,
    CheckCircle,
    Clock,
    ExternalLink,
    Filter
} from 'lucide-react'
import { TitheConfirmButton } from '@/components/tithe/tithe-confirm-button'

export default async function FinanceiroDizimosPage({
    searchParams,
}: {
    searchParams: { mes?: string; ano?: string }
}) {
    const profile = await getProfile()

    if (!profile) {
        redirect('/entrar')
    }

    // Check if user is in finance team
    const financeCheck = await isInFinanceTeam()
    if (!financeCheck.isInTeam) {
        redirect('/membro')
    }

    // Get filter params
    const now = new Date()
    const month = searchParams.mes ? parseInt(searchParams.mes) : now.getMonth() + 1
    const year = searchParams.ano ? parseInt(searchParams.ano) : now.getFullYear()

    // Get all tithes
    const tithesResult = await getAllTithes({ month, year })
    const tithes = tithesResult.success ? tithesResult.data || [] : []

    const pendingTithes = tithes.filter((t: any) => t.status === 'PENDING')
    const confirmedTithes = tithes.filter((t: any) => t.status === 'CONFIRMED')

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100)
    }

    const getMonthName = (m: number) => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        return months[m - 1]
    }

    const getPaymentMethodLabel = (method: string | null) => {
        const labels: Record<string, string> = {
            pix: 'PIX',
            transfer: 'Transferência',
            cash: 'Dinheiro',
            other: 'Outro'
        }
        return method ? labels[method] || method : '-'
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
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                            <HandCoins className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground">
                                Dízimos dos Membros
                            </h1>
                            <p className="text-muted-foreground">
                                {getMonthName(month)} de {year}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Filter className="w-4 h-4" />
                            <span>Filtrar:</span>
                        </div>
                        <div className="flex gap-2">
                            <select
                                defaultValue={month}
                                className="px-3 py-2 bg-background border border-border rounded-xl text-sm font-medium"
                                onChange={(e) => {
                                    const url = new URL(window.location.href)
                                    url.searchParams.set('mes', e.target.value)
                                    window.location.href = url.toString()
                                }}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {getMonthName(i + 1)}
                                    </option>
                                ))}
                            </select>
                            <select
                                defaultValue={year}
                                className="px-3 py-2 bg-background border border-border rounded-xl text-sm font-medium"
                                onChange={(e) => {
                                    const url = new URL(window.location.href)
                                    url.searchParams.set('ano', e.target.value)
                                    window.location.href = url.toString()
                                }}
                            >
                                {[year - 1, year, year + 1].map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Pendentes
                            </span>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            {pendingTithes.length}
                        </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Confirmados
                            </span>
                        </div>
                        <p className="text-2xl font-black text-foreground">
                            {confirmedTithes.length}
                        </p>
                    </div>
                </div>

                {/* Pending Tithes */}
                {pendingTithes.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Aguardando Confirmação ({pendingTithes.length})
                        </h2>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="divide-y divide-border">
                                {pendingTithes.map((tithe: any) => (
                                    <div
                                        key={tithe.id}
                                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
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
                                                        {(tithe.profile?.full_name || 'M')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    {tithe.profile?.full_name || 'Membro'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(tithe.amount_cents)} • {getPaymentMethodLabel(tithe.payment_method)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {tithe.receipt_url && (
                                                <a
                                                    href={tithe.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Ver comprovante"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            )}
                                            <TitheConfirmButton titheId={tithe.id} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmed Tithes */}
                {confirmedTithes.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Confirmados ({confirmedTithes.length})
                        </h2>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="divide-y divide-border">
                                {confirmedTithes.map((tithe: any) => (
                                    <div
                                        key={tithe.id}
                                        className="flex items-center justify-between p-4"
                                    >
                                        <div className="flex items-center gap-4">
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
                                                        {(tithe.profile?.full_name || 'M')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    {tithe.profile?.full_name || 'Membro'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(tithe.amount_cents)} • {getPaymentMethodLabel(tithe.payment_method)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-bold">Confirmado</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {tithes.length === 0 && (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
                        <HandCoins className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Nenhum dízimo registrado
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Não há dízimos registrados para este período
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
