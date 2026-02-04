import { Suspense } from 'react'
import Link from 'next/link'
import {
    MessageSquare,
    Plus,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle,
    Inbox,
    Send
} from 'lucide-react'
import { getTickets, getTicketStats, type TicketFilters } from '@/actions/super-admin/tickets'
import { TicketsTable } from './tickets-table'
import { cn } from '@/lib/utils'

interface SupportPageProps {
    searchParams: Promise<{
        status?: string
        priority?: string
        search?: string
        page?: string
    }>
}

function StatsCardSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse">
            <div className="h-4 w-20 bg-zinc-800 rounded mb-2" />
            <div className="h-8 w-12 bg-zinc-800 rounded" />
        </div>
    )
}

function TableSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
                <div className="h-10 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-zinc-800">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-16 bg-zinc-800 rounded" />
                            <div className="h-4 flex-1 bg-zinc-800 rounded" />
                            <div className="h-4 w-24 bg-zinc-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

async function StatsCards() {
    const stats = await getTicketStats()

    const cards = [
        {
            label: 'Abertos',
            value: stats.open,
            icon: Inbox,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20'
        },
        {
            label: 'Em Andamento',
            value: stats.in_progress,
            icon: Clock,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20'
        },
        {
            label: 'Urgentes',
            value: stats.urgent,
            icon: AlertCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20'
        },
        {
            label: 'Resolvidos (7d)',
            value: stats.resolved,
            icon: CheckCircle,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => (
                <div key={card.label} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', card.bgColor)}>
                            <card.icon className={cn('h-5 w-5', card.color)} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
                            <p className="text-sm text-zinc-400">{card.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

async function TicketsList({ filters }: { filters: TicketFilters }) {
    const { tickets, total, page, totalPages } = await getTickets(filters)

    return (
        <TicketsTable
            tickets={tickets}
            total={total}
            page={page}
            totalPages={totalPages}
            currentFilters={filters}
        />
    )
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
    const params = await searchParams

    const filters: TicketFilters = {
        status: (params.status as TicketFilters['status']) || 'all',
        priority: (params.priority as TicketFilters['priority']) || 'all',
        search: params.search,
        page: params.page ? parseInt(params.page) : 1
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Suporte</h1>
                    <p className="text-zinc-400 mt-1">Gerencie tickets e comunicacoes</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/support/communications"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <Send className="h-4 w-4" />
                        Comunicacoes
                    </Link>
                    <Link
                        href="/admin/support/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-orange-500 hover:bg-orange-400 rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Ticket
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <Suspense fallback={
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
                </div>
            }>
                <StatsCards />
            </Suspense>

            {/* Tickets Table */}
            <Suspense fallback={<TableSkeleton />}>
                <TicketsList filters={filters} />
            </Suspense>
        </div>
    )
}
