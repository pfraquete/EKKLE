import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
import { getCellBalance, getCellOfferings } from '@/actions/cell-offerings'
import { getProfile } from '@/actions/auth'
import { getMemberCellData } from '@/actions/cell'
import { Wallet, HandCoins, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { CellOfferingButton } from '@/components/cell-offering/cell-offering-button'

export default async function CellOfferingsPage() {
    const church = await getChurch()

    if (!church) {
        redirect('/')
    }

    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    // Get cell data - this checks if user has an active cell
    const cellData = await getMemberCellData()

    if (!cellData) {
        redirect('/membro/minha-celula')
    }

    const { cell } = cellData

    // Fetch data
    const [balanceResult, offeringsResult] = await Promise.all([
        getCellBalance(),
        getCellOfferings(20),
    ])

    const balance = balanceResult.success ? balanceResult.data?.balance_cents || 0 : 0
    const offerings = offeringsResult.success ? offeringsResult.data || [] : []

    const statusConfig = {
        PAID: { icon: CheckCircle, label: 'Pago', color: 'text-emerald-500 bg-emerald-500/10' },
        PENDING: { icon: Clock, label: 'Pendente', color: 'text-amber-500 bg-amber-500/10' },
        FAILED: { icon: XCircle, label: 'Falhou', color: 'text-destructive bg-destructive/10' },
        CANCELLED: { icon: XCircle, label: 'Cancelado', color: 'text-muted-foreground bg-muted' },
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Back Link */}
            <Link
                href="/membro/minha-celula"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Minha Célula
            </Link>

            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                    Oferta da Célula
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
                    {cell.name}
                </p>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">
                                Caixa da Célula
                            </p>
                            <p className="text-3xl sm:text-4xl font-black text-foreground">
                                {formatCurrency(balance / 100)}
                            </p>
                        </div>
                    </div>
                    <CellOfferingButton profile={profile} />
                </div>
            </div>

            {/* Offerings List */}
            <section>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-muted-foreground/30 rounded-full" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight">
                        Últimas Ofertas
                    </h2>
                </div>

                {offerings.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
                        <HandCoins className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Nenhuma oferta ainda
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Seja o primeiro a contribuir para o caixa da célula
                        </p>
                    </div>
                ) : (
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                        <div className="divide-y divide-border">
                            {offerings.map((offering: any) => {
                                const status = statusConfig[offering.status as keyof typeof statusConfig]
                                const StatusIcon = status.icon

                                return (
                                    <div
                                        key={offering.id}
                                        className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                                                {offering.profile?.photo_url ? (
                                                    <Image
                                                        src={offering.profile.photo_url}
                                                        alt={offering.profile.full_name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                                        {(offering.profile?.full_name || 'A')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    {offering.profile?.full_name || 'Anônimo'}
                                                </p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    {new Date(offering.created_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-xs font-bold ${status.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {status.label}
                                            </span>
                                            <span className="font-black text-foreground text-sm sm:text-base">
                                                {formatCurrency(offering.amount_cents / 100)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Info */}
            <div className="text-sm text-muted-foreground text-center">
                <p>As ofertas são processadas com taxa de 1% para a plataforma.</p>
                <p>99% do valor vai diretamente para o caixa da célula.</p>
            </div>
        </div>
    )
}
