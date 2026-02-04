import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    MessageSquare,
    User,
    Building2,
    Clock,
    Calendar,
    Tag,
    UserCog
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getTicket, getTicketMessages, getAdminsForAssignment } from '@/actions/super-admin/tickets'
import { TicketChat } from './ticket-chat'
import { TicketActions } from './ticket-actions'

interface TicketDetailPageProps {
    params: Promise<{
        id: string
    }>
}

const statusConfig = {
    open: { label: 'Aberto', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    waiting_response: { label: 'Aguardando', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    resolved: { label: 'Resolvido', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    closed: { label: 'Fechado', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' }
}

const priorityConfig = {
    low: { label: 'Baixa', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
    medium: { label: 'Media', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    high: { label: 'Alta', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    urgent: { label: 'Urgente', color: 'text-red-400', bgColor: 'bg-red-500/20' }
}

const categoryLabels = {
    billing: 'Cobranca',
    technical: 'Tecnico',
    feature_request: 'Solicitacao',
    bug: 'Bug',
    account: 'Conta',
    other: 'Outro'
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
    const { id } = await params

    const [ticket, messages, admins] = await Promise.all([
        getTicket(id),
        getTicketMessages(id),
        getAdminsForAssignment()
    ])

    if (!ticket) {
        notFound()
    }

    const status = statusConfig[ticket.status]
    const priority = priorityConfig[ticket.priority]

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pb-4 border-b border-zinc-800">
                <Link
                    href="/admin/support"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para tickets
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-zinc-500">#{ticket.ticket_number}</span>
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                status.bgColor,
                                status.color
                            )}>
                                {status.label}
                            </span>
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                priority.bgColor,
                                priority.color
                            )}>
                                {priority.label}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-zinc-100 truncate">{ticket.subject}</h1>
                    </div>

                    <TicketActions
                        ticketId={ticket.id}
                        currentStatus={ticket.status}
                        currentPriority={ticket.priority}
                        currentAssignedTo={ticket.assigned_to}
                        admins={admins}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex gap-6 pt-4 min-h-0">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <TicketChat
                        ticketId={ticket.id}
                        initialMessages={messages}
                        ticketStatus={ticket.status}
                    />
                </div>

                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
                    {/* Requester Info */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Solicitante
                        </h3>
                        <div className="space-y-3">
                            {ticket.requester ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                            {ticket.requester.avatar_url ? (
                                                <img
                                                    src={ticket.requester.avatar_url}
                                                    alt={ticket.requester.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-5 w-5 text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-zinc-100 truncate">
                                                {ticket.requester.full_name}
                                            </p>
                                            <p className="text-sm text-zinc-500 truncate">
                                                {ticket.requester.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/admin/users/${ticket.requester.id}`}
                                        className="block text-sm text-orange-400 hover:text-orange-300"
                                    >
                                        Ver perfil completo
                                    </Link>
                                </>
                            ) : (
                                <div>
                                    <p className="text-zinc-200">
                                        {ticket.requester_name || 'Nome nao informado'}
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        {ticket.requester_email || 'Email nao informado'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Church Info */}
                    {ticket.church && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Igreja
                            </h3>
                            <div>
                                <p className="font-medium text-zinc-100">{ticket.church.name}</p>
                                <p className="text-sm text-zinc-500">{ticket.church.slug}.ekkle.com.br</p>
                                <Link
                                    href={`/admin/churches/${ticket.church.id}`}
                                    className="block text-sm text-orange-400 hover:text-orange-300 mt-2"
                                >
                                    Ver igreja
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Assigned Admin */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Atribuido a
                        </h3>
                        {ticket.assigned_admin ? (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                    <User className="h-4 w-4 text-zinc-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-zinc-100 truncate">
                                        {ticket.assigned_admin.full_name}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {ticket.assigned_admin.email}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500">Nao atribuido</p>
                        )}
                    </div>

                    {/* Details */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Detalhes
                        </h3>
                        <div className="space-y-3 text-sm">
                            {ticket.category && (
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Categoria</span>
                                    <span className="text-zinc-200">
                                        {categoryLabels[ticket.category as keyof typeof categoryLabels] || ticket.category}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Origem</span>
                                <span className="text-zinc-200 capitalize">
                                    {ticket.source.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Criado em</span>
                                <span className="text-zinc-200">
                                    {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                            </div>
                            {ticket.first_response_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">1a Resposta</span>
                                    <span className="text-zinc-200">
                                        {formatDistanceToNow(new Date(ticket.first_response_at), {
                                            locale: ptBR
                                        })} depois
                                    </span>
                                </div>
                            )}
                            {ticket.resolved_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Resolvido em</span>
                                    <span className="text-zinc-200">
                                        {format(new Date(ticket.resolved_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {ticket.description && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Descricao
                            </h3>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                                {ticket.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
