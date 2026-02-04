import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getChurchDetails } from '@/actions/super-admin/churches'
import {
    Building2,
    ArrowLeft,
    Users,
    Calendar,
    CreditCard,
    Mail,
    Globe,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileText,
    UserCog
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ChurchActions } from './church-actions'
import { ImpersonateButton } from './impersonate-button'

interface ChurchDetailPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ChurchDetailPage({ params }: ChurchDetailPageProps) {
    const { id } = await params
    const church = await getChurchDetails(id)

    if (!church) {
        notFound()
    }

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100)
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Link
                href="/admin/churches"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para igrejas
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {church.logo_url ? (
                            <img
                                src={church.logo_url}
                                alt={church.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 className="h-8 w-8 text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-zinc-100">{church.name}</h1>
                            <span className={cn(
                                'px-2 py-1 text-xs font-medium rounded-full',
                                (!church.status || church.status === 'active') && 'bg-emerald-500/20 text-emerald-400',
                                church.status === 'suspended' && 'bg-yellow-500/20 text-yellow-400',
                                church.status === 'deleted' && 'bg-red-500/20 text-red-400'
                            )}>
                                {!church.status || church.status === 'active' ? 'Ativa' :
                                    church.status === 'suspended' ? 'Suspensa' : 'Deletada'}
                            </span>
                        </div>
                        <p className="text-zinc-400 mt-1">{church.slug}.ekkle.com.br</p>
                    </div>
                </div>

                <ChurchActions
                    churchId={church.id}
                    churchName={church.name}
                    status={church.status}
                />
            </div>

            {/* Suspension warning */}
            {church.status === 'suspended' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-yellow-200">Igreja Suspensa</h3>
                            {church.suspension_reason && (
                                <p className="text-sm text-yellow-200/70 mt-1">
                                    Motivo: {church.suspension_reason}
                                </p>
                            )}
                            {church.suspended_at && (
                                <p className="text-xs text-yellow-200/50 mt-1">
                                    Suspensa em {format(new Date(church.suspended_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-100">{church.members_count}</p>
                            <p className="text-sm text-zinc-400">Membros</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-100">{church.cells_count}</p>
                            <p className="text-sm text-zinc-400">Celulas</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <CreditCard className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            {church.subscription ? (
                                <>
                                    <p className="text-lg font-bold text-zinc-100">
                                        {church.subscription.plan?.name || 'Plano'}
                                    </p>
                                    <p className="text-sm text-zinc-400">
                                        {formatCurrency(church.subscription.plan?.price_monthly || 0)}/mes
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-bold text-zinc-400">Sem plano</p>
                                    <p className="text-sm text-zinc-500">Nenhuma assinatura</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                            <Clock className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-zinc-100">
                                {format(new Date(church.created_at), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-sm text-zinc-400">Data de criacao</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Church Info */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="font-semibold text-zinc-100">Informacoes</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        {church.description && (
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Descricao
                                </p>
                                <p className="text-zinc-300">{church.description}</p>
                            </div>
                        )}

                        {church.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                        Endereco
                                    </p>
                                    <p className="text-zinc-300">{church.address}</p>
                                </div>
                            </div>
                        )}

                        {church.pastor && (
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <UserCog className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                            Pastor
                                        </p>
                                        <p className="text-zinc-300">{church.pastor.full_name}</p>
                                        <p className="text-sm text-zinc-500">{church.pastor.email}</p>
                                    </div>
                                </div>
                                <ImpersonateButton
                                    userId={church.pastor.id}
                                    userName={church.pastor.full_name}
                                    userEmail={church.pastor.email}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Notes */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-500" />
                        <h2 className="font-semibold text-zinc-100">Notas Administrativas</h2>
                    </div>
                    <div className="p-4">
                        {church.admin_notes ? (
                            <p className="text-zinc-300 whitespace-pre-wrap">{church.admin_notes}</p>
                        ) : (
                            <p className="text-zinc-500 text-sm">Nenhuma nota administrativa</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
