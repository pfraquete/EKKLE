'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    CheckCircle,
    MessageSquare,
    User,
    Building2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Ticket, TicketFilters, TicketStatus, TicketPriority } from '@/actions/super-admin/tickets'

interface TicketsTableProps {
    tickets: Ticket[]
    total: number
    page: number
    totalPages: number
    currentFilters: TicketFilters
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
    open: { label: 'Aberto', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    waiting_response: { label: 'Aguardando', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    resolved: { label: 'Resolvido', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    closed: { label: 'Fechado', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' }
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
    low: { label: 'Baixa', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
    medium: { label: 'Media', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    high: { label: 'Alta', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    urgent: { label: 'Urgente', color: 'text-red-400', bgColor: 'bg-red-500/20' }
}

export function TicketsTable({ tickets, total, page, totalPages, currentFilters }: TicketsTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(currentFilters.search || '')

    const updateFilters = (updates: Partial<TicketFilters>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, String(value))
            } else {
                params.delete(key)
            }
        })

        // Reset to page 1 when filters change (except for page changes)
        if (!('page' in updates)) {
            params.delete('page')
        }

        router.push(`/admin/support?${params.toString()}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateFilters({ search: search || undefined })
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por assunto, descricao ou email..."
                                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>
                    </form>

                    {/* Status Filter */}
                    <select
                        value={currentFilters.status || 'all'}
                        onChange={(e) => updateFilters({ status: e.target.value as TicketFilters['status'] })}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="all">Todos os status</option>
                        <option value="open">Abertos</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="waiting_response">Aguardando Resposta</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="closed">Fechados</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={currentFilters.priority || 'all'}
                        onChange={(e) => updateFilters({ priority: e.target.value as TicketFilters['priority'] })}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="all">Todas prioridades</option>
                        <option value="urgent">Urgente</option>
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baixa</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-800/50">
                            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                                Ticket
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                                Solicitante
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                                Status
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                                Prioridade
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                                Atualizado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                                    Nenhum ticket encontrado
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => {
                                const status = statusConfig[ticket.status]
                                const priority = priorityConfig[ticket.priority]

                                return (
                                    <tr key={ticket.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <Link href={`/admin/support/${ticket.id}`} className="block group">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-zinc-500">
                                                                #{ticket.ticket_number}
                                                            </span>
                                                            {ticket.message_count > 0 && (
                                                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    {ticket.message_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-zinc-100 group-hover:text-orange-400 transition-colors truncate">
                                                            {ticket.subject}
                                                        </p>
                                                        {ticket.category && (
                                                            <span className="text-xs text-zinc-500 capitalize">
                                                                {ticket.category.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {ticket.requester ? (
                                                    <>
                                                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                                            {ticket.requester.avatar_url ? (
                                                                <img
                                                                    src={ticket.requester.avatar_url}
                                                                    alt={ticket.requester.full_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="h-4 w-4 text-zinc-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-zinc-200 truncate">
                                                                {ticket.requester.full_name}
                                                            </p>
                                                            {ticket.church && (
                                                                <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                                                                    <Building2 className="h-3 w-3" />
                                                                    {ticket.church.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-zinc-200 truncate">
                                                            {ticket.requester_name || ticket.requester_email || 'Desconhecido'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                status.bgColor,
                                                status.color
                                            )}>
                                                {ticket.status === 'open' && <Clock className="h-3 w-3" />}
                                                {ticket.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                priority.bgColor,
                                                priority.color
                                            )}>
                                                {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3" />}
                                                {priority.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-zinc-400">
                                                {formatDistanceToNow(new Date(ticket.last_message_at || ticket.updated_at), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400">
                        Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, total)} de {total} tickets
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateFilters({ page: page - 1 })}
                            disabled={page <= 1}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-zinc-400">
                            Pagina {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => updateFilters({ page: page + 1 })}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
