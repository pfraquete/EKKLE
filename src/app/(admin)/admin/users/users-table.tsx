'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    UserCog,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    Crown,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { UserWithDetails } from '@/actions/super-admin/users'
import { ImpersonateButton } from './impersonate-button'

interface UsersTableProps {
    users: UserWithDetails[]
    total: number
    page: number
    totalPages: number
}

const roleLabels: Record<string, string> = {
    PASTOR: 'Pastor',
    DISCIPULADOR: 'Discipulador',
    LEADER: 'Lider',
    MEMBER: 'Membro'
}

const roleColors: Record<string, string> = {
    PASTOR: 'bg-purple-500/20 text-purple-400',
    DISCIPULADOR: 'bg-blue-500/20 text-blue-400',
    LEADER: 'bg-emerald-500/20 text-emerald-400',
    MEMBER: 'bg-zinc-500/20 text-zinc-400'
}

const roleIcons: Record<string, React.ReactNode> = {
    PASTOR: <Crown className="h-3.5 w-3.5" />,
    DISCIPULADOR: <Shield className="h-3.5 w-3.5" />,
    LEADER: <UserCog className="h-3.5 w-3.5" />,
    MEMBER: <User className="h-3.5 w-3.5" />
}

export function UsersTable({ users, total, page, totalPages }: UsersTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    const updateFilters = (params: Record<string, string>) => {
        const newParams = new URLSearchParams(searchParams.toString())
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, value)
            } else {
                newParams.delete(key)
            }
        })
        newParams.set('page', '1')
        router.push(`/admin/users?${newParams.toString()}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateFilters({ search: searchQuery })
    }

    const handleRoleChange = (role: string) => {
        setRoleFilter(role)
        updateFilters({ role: role === 'all' ? '' : role })
    }

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('page', newPage.toString())
        router.push(`/admin/users?${newParams.toString()}`)
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
                            placeholder="Buscar por nome, email ou telefone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="all">Todos os roles</option>
                        <option value="PASTOR">Pastor</option>
                        <option value="DISCIPULADOR">Discipulador</option>
                        <option value="LEADER">Lider</option>
                        <option value="MEMBER">Membro</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-zinc-400">
                {total} usuario{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Igreja
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Cadastro
                                </th>
                                <th className="w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                        Nenhum usuario encontrado
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {user.photo_url ? (
                                                        <img
                                                            src={user.photo_url}
                                                            alt={user.full_name || ''}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-5 w-5 text-zinc-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-200">
                                                        {user.full_name || 'Sem nome'}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
                                                roleColors[user.role] || 'bg-zinc-500/20 text-zinc-400'
                                            )}>
                                                {roleIcons[user.role]}
                                                {roleLabels[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.church ? (
                                                <Link
                                                    href={`/admin/churches/${user.church.id}`}
                                                    className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                    <span className="text-sm">{user.church.name}</span>
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-zinc-500">Sem igreja</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-zinc-400">
                                                {formatDistanceToNow(new Date(user.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <ImpersonateButton
                                                    userId={user.id}
                                                    userName={user.full_name || user.email}
                                                    userEmail={user.email}
                                                    compact
                                                />
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <Eye className="h-4 w-4 text-zinc-400" />
                                                </Link>
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
        </div>
    )
}
