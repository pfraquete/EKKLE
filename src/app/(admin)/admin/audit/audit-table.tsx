'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, User, Building2, Settings, Flag, Puzzle, Bell, Webhook } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AuditLog } from '@/actions/super-admin/audit'

interface AuditTableProps {
    logs: AuditLog[]
    total: number
    page: number
    totalPages: number
}

const TARGET_ICONS: Record<string, typeof User> = {
    church: Building2,
    profile: User,
    setting: Settings,
    feature_flag: Flag,
    integration: Puzzle,
    alert: Bell,
    webhook: Webhook
}

const ACTION_LABELS: Record<string, string> = {
    'church.view': 'Visualizou igreja',
    'church.update': 'Atualizou igreja',
    'church.suspend': 'Suspendeu igreja',
    'church.reactivate': 'Reativou igreja',
    'church.delete': 'Deletou igreja',
    'subscription.view': 'Visualizou assinatura',
    'subscription.cancel': 'Cancelou assinatura',
    'subscription.extend': 'Estendeu assinatura',
    'setting.view': 'Visualizou configuracao',
    'setting.update': 'Atualizou configuracao',
    'feature_flag.create': 'Criou feature flag',
    'feature_flag.update': 'Atualizou feature flag',
    'feature_flag.delete': 'Deletou feature flag',
    'integration.check': 'Verificou integracao',
    'integration.configure': 'Configurou integracao',
    'webhook.retry': 'Reenviou webhook',
    'alert.resolve': 'Resolveu alerta',
    'alert.dismiss': 'Descartou alerta'
}

export function AuditTable({ logs, total, page, totalPages }: AuditTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`/admin/audit?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            {/* Results count */}
            <div className="text-sm text-zinc-400">
                {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Admin
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Acao
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Alvo
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Igreja
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                        Nenhum registro encontrado
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const TargetIcon = TARGET_ICONS[log.target_type] || Settings

                                    return (
                                        <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-orange-500">
                                                            {log.admin?.full_name?.charAt(0) || 'A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-200">
                                                            {log.admin?.full_name || 'Admin'}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">
                                                            {log.admin?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-zinc-300">
                                                    {ACTION_LABELS[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <TargetIcon className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-sm text-zinc-400">
                                                        {log.target_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {log.church ? (
                                                    <span className="text-sm text-zinc-300">
                                                        {log.church.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-zinc-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm text-zinc-300">
                                                        {format(new Date(log.created_at), 'dd/MM/yyyy')}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        {format(new Date(log.created_at), 'HH:mm:ss')}
                                                    </p>
                                                </div>
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
