import { Suspense } from 'react'
import Link from 'next/link'
import {
    Send,
    Plus,
    Mail,
    MessageSquare,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getCommunications, type CommunicationStatus, type CommunicationChannel } from '@/actions/super-admin/communications'

interface CommunicationsPageProps {
    searchParams: Promise<{
        status?: string
        channel?: string
        page?: string
    }>
}

const statusConfig: Record<CommunicationStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    draft: { label: 'Rascunho', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', icon: FileText },
    scheduled: { label: 'Agendado', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Clock },
    sending: { label: 'Enviando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Send },
    sent: { label: 'Enviado', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: CheckCircle },
    partially_sent: { label: 'Parcial', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: CheckCircle },
    failed: { label: 'Falhou', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle }
}

const channelConfig: Record<CommunicationChannel, { label: string; icon: typeof Mail }> = {
    email: { label: 'Email', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare },
    both: { label: 'Email + WhatsApp', icon: Send },
    in_app: { label: 'In-App', icon: MessageSquare }
}

function TableSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-800">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-48 bg-zinc-800 rounded" />
                            <div className="h-4 w-24 bg-zinc-800 rounded" />
                            <div className="h-4 w-20 bg-zinc-800 rounded ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

async function CommunicationsList({ status, channel, page }: { status?: string; channel?: string; page: number }) {
    const { communications, total, totalPages } = await getCommunications({
        status: status as CommunicationStatus | 'all',
        channel: channel as CommunicationChannel | 'all',
        page
    })

    if (communications.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
                <Send className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">Nenhuma comunicacao</h3>
                <p className="text-zinc-500 mb-4">Crie sua primeira comunicacao para enviar aos clientes</p>
                <Link
                    href="/admin/support/communications/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-zinc-900 font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nova Comunicacao
                </Link>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-zinc-800/50">
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                            Comunicacao
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                            Canal
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                            Status
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                            Enviados
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                            Data
                        </th>
                        <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {communications.map((comm) => {
                        const statusInfo = statusConfig[comm.status]
                        const channelInfo = channelConfig[comm.channel]
                        const StatusIcon = statusInfo.icon
                        const ChannelIcon = channelInfo.icon

                        return (
                            <tr key={comm.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-4 py-4">
                                    <Link href={`/admin/support/communications/${comm.id}`} className="block group">
                                        <p className="font-medium text-zinc-100 group-hover:text-orange-400 transition-colors">
                                            {comm.title}
                                        </p>
                                        {comm.subject && (
                                            <p className="text-sm text-zinc-500 truncate max-w-xs">
                                                {comm.subject}
                                            </p>
                                        )}
                                    </Link>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="flex items-center gap-2 text-sm text-zinc-300">
                                        <ChannelIcon className="h-4 w-4 text-zinc-500" />
                                        {channelInfo.label}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                        statusInfo.bgColor,
                                        statusInfo.color
                                    )}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusInfo.label}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-sm text-zinc-300">
                                        {comm.delivered_count}/{comm.total_recipients}
                                    </span>
                                    {comm.failed_count > 0 && (
                                        <span className="text-xs text-red-400 ml-1">
                                            ({comm.failed_count} falhas)
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-sm text-zinc-400">
                                        {format(new Date(comm.sent_at || comm.created_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <Link
                                        href={`/admin/support/communications/${comm.id}`}
                                        className="p-2 rounded-lg hover:bg-zinc-700 transition-colors inline-block"
                                    >
                                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                                    </Link>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400">
                        {total} comunicacoes
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">
                            Pagina {page} de {totalPages}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default async function CommunicationsPage({ searchParams }: CommunicationsPageProps) {
    const params = await searchParams
    const page = params.page ? parseInt(params.page) : 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Comunicacoes</h1>
                    <p className="text-zinc-400 mt-1">Envie emails e mensagens WhatsApp para os clientes</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/support/communications/templates"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <FileText className="h-4 w-4" />
                        Templates
                    </Link>
                    <Link
                        href="/admin/support/communications/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-orange-500 hover:bg-orange-400 rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Comunicacao
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Link
                    href="/admin/support/communications?status=draft"
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-500/20">
                            <FileText className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Rascunhos</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/admin/support/communications?status=scheduled"
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Clock className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Agendados</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/admin/support/communications?status=sent"
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Enviados</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/admin/support"
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                            <MessageSquare className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Ver Tickets</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* List */}
            <Suspense fallback={<TableSkeleton />}>
                <CommunicationsList
                    status={params.status}
                    channel={params.channel}
                    page={page}
                />
            </Suspense>
        </div>
    )
}
