import { Suspense } from 'react'
import { getAuditLogs, getAuditStats } from '@/actions/super-admin/audit'
import { History, Search, Filter, Download, Calendar } from 'lucide-react'
import { AuditTable } from './audit-table'
import { format } from 'date-fns'

export const metadata = {
    title: 'Auditoria | Admin Ekkle',
    description: 'Logs de auditoria do sistema'
}

interface AuditPageProps {
    searchParams: Promise<{
        page?: string
        action?: string
        targetType?: string
    }>
}

async function AuditContent({ searchParams }: { searchParams: AuditPageProps['searchParams'] }) {
    const params = await searchParams
    const [logsResult, stats] = await Promise.all([
        getAuditLogs({
            page: params.page ? parseInt(params.page) : 1,
            action: params.action,
            targetType: params.targetType
        }),
        getAuditStats()
    ])

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <p className="text-sm text-zinc-400">Ultimas 24h</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.last24h}</p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <p className="text-sm text-zinc-400">Ultimos 7 dias</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.last7d}</p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <p className="text-sm text-zinc-400">Ultimos 30 dias</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.last30d}</p>
                </div>
            </div>

            {/* Table */}
            <AuditTable
                logs={logsResult.logs}
                total={logsResult.total}
                page={logsResult.page}
                totalPages={logsResult.totalPages}
            />
        </>
    )
}

function AuditSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                        <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                        <div className="h-8 w-16 bg-zinc-800 rounded mt-2 animate-pulse" />
                    </div>
                ))}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            {[...Array(5)].map((_, i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, i) => (
                            <tr key={i} className="border-b border-zinc-800">
                                {[...Array(5)].map((_, j) => (
                                    <td key={j} className="px-4 py-3">
                                        <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function AuditPage({ searchParams }: AuditPageProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                        <History className="h-7 w-7 text-orange-500" />
                        Auditoria
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Historico de acoes administrativas
                    </p>
                </div>
            </div>

            {/* Content */}
            <Suspense fallback={<AuditSkeleton />}>
                <AuditContent searchParams={searchParams} />
            </Suspense>
        </div>
    )
}
