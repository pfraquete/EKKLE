'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Building2,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Ban,
    CheckCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Users,
    CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { ChurchWithDetails } from '@/actions/super-admin/churches'
import { suspendChurch, reactivateChurch } from '@/actions/super-admin/churches'
import { SuspendChurchDialog } from './suspend-dialog'

interface ChurchesTableProps {
    churches: ChurchWithDetails[]
    total: number
    page: number
    totalPages: number
}

export function ChurchesTable({ churches, total, page, totalPages }: ChurchesTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; churchId: string; churchName: string }>({
        open: false,
        churchId: '',
        churchName: ''
    })

    const updateFilters = (params: Record<string, string>) => {
        const newParams = new URLSearchParams(searchParams.toString())
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, value)
            } else {
                newParams.delete(key)
            }
        })
        newParams.set('page', '1') // Reset to first page
        router.push(`/admin/churches?${newParams.toString()}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateFilters({ search: searchQuery })
    }

    const handleStatusChange = (status: string) => {
        setStatusFilter(status)
        updateFilters({ status })
    }

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('page', newPage.toString())
        router.push(`/admin/churches?${newParams.toString()}`)
    }

    const handleReactivate = async (churchId: string) => {
        startTransition(async () => {
            try {
                await reactivateChurch(churchId)
                setOpenMenu(null)
            } catch (error) {
                console.error('Failed to reactivate:', error)
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou slug..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="all">Todos os status</option>
                        <option value="active">Ativas</option>
                        <option value="suspended">Suspensas</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-zinc-400">
                {total} igreja{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Igreja
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Membros
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Assinatura
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Criada
                                </th>
                                <th className="w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {churches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                        Nenhuma igreja encontrada
                                    </td>
                                </tr>
                            ) : (
                                churches.map((church) => (
                                    <tr key={church.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {church.logo_url ? (
                                                        <img
                                                            src={church.logo_url}
                                                            alt={church.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-5 w-5 text-zinc-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-200">{church.name}</p>
                                                    <p className="text-xs text-zinc-500">{church.slug}.ekkle.com.br</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                'px-2 py-1 text-xs font-medium rounded-full',
                                                (!church.status || church.status === 'active') && 'bg-emerald-500/20 text-emerald-400',
                                                church.status === 'suspended' && 'bg-yellow-500/20 text-yellow-400',
                                                church.status === 'deleted' && 'bg-red-500/20 text-red-400'
                                            )}>
                                                {!church.status || church.status === 'active' ? 'Ativa' :
                                                    church.status === 'suspended' ? 'Suspensa' : 'Deletada'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Users className="h-4 w-4" />
                                                <span className="text-sm">{church.members_count || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {church.subscription ? (
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="h-4 w-4 text-zinc-400" />
                                                    <span className={cn(
                                                        'text-sm',
                                                        church.subscription.status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
                                                    )}>
                                                        {church.subscription.plan?.name || 'Plano'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-zinc-500">Sem assinatura</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-zinc-400">
                                                {formatDistanceToNow(new Date(church.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenu(openMenu === church.id ? null : church.id)}
                                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                >
                                                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                </button>

                                                {openMenu === church.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenu(null)}
                                                        />
                                                        <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                                                            <Link
                                                                href={`/admin/churches/${church.id}`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Ver detalhes
                                                            </Link>

                                                            {church.status === 'suspended' ? (
                                                                <button
                                                                    onClick={() => handleReactivate(church.id)}
                                                                    disabled={isPending}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-700 transition-colors w-full disabled:opacity-50"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Reativar
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setSuspendDialog({
                                                                            open: true,
                                                                            churchId: church.id,
                                                                            churchName: church.name
                                                                        })
                                                                        setOpenMenu(null)
                                                                    }}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-zinc-700 transition-colors w-full"
                                                                >
                                                                    <Ban className="h-4 w-4" />
                                                                    Suspender
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-zinc-400">
                            Pagina {page} de {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4 text-zinc-400" />
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Suspend Dialog */}
            <SuspendChurchDialog
                open={suspendDialog.open}
                onOpenChange={(open) => setSuspendDialog(prev => ({ ...prev, open }))}
                churchId={suspendDialog.churchId}
                churchName={suspendDialog.churchName}
            />
        </div>
    )
}
