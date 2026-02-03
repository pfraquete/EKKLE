import { Suspense } from 'react'
import { getSystemAlerts, resolveAlert } from '@/actions/super-admin/audit'
import { AlertTriangle, CheckCircle2, Info, AlertCircle, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { AlertsList } from './alerts-list'

export const metadata = {
    title: 'Alertas | Admin Ekkle',
    description: 'Alertas do sistema Ekkle'
}

async function AlertsContent() {
    const [unresolvedAlerts, resolvedAlerts] = await Promise.all([
        getSystemAlerts({ resolved: false }),
        getSystemAlerts({ resolved: true, limit: 20 })
    ])

    const stats = {
        critical: unresolvedAlerts.filter(a => a.alert_type === 'critical').length,
        warning: unresolvedAlerts.filter(a => a.alert_type === 'warning').length,
        info: unresolvedAlerts.filter(a => a.alert_type === 'info').length
    }

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn(
                    'p-4 rounded-xl border',
                    stats.critical > 0
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-zinc-900 border-zinc-800'
                )}>
                    <div className="flex items-center gap-3">
                        <AlertCircle className={cn(
                            'h-5 w-5',
                            stats.critical > 0 ? 'text-red-400' : 'text-zinc-500'
                        )} />
                        <div>
                            <p className={cn(
                                'text-2xl font-bold',
                                stats.critical > 0 ? 'text-red-400' : 'text-zinc-400'
                            )}>
                                {stats.critical}
                            </p>
                            <p className="text-sm text-zinc-500">Criticos</p>
                        </div>
                    </div>
                </div>
                <div className={cn(
                    'p-4 rounded-xl border',
                    stats.warning > 0
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-zinc-900 border-zinc-800'
                )}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={cn(
                            'h-5 w-5',
                            stats.warning > 0 ? 'text-yellow-400' : 'text-zinc-500'
                        )} />
                        <div>
                            <p className={cn(
                                'text-2xl font-bold',
                                stats.warning > 0 ? 'text-yellow-400' : 'text-zinc-400'
                            )}>
                                {stats.warning}
                            </p>
                            <p className="text-sm text-zinc-500">Warnings</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-xl border bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-zinc-100">
                                {stats.info}
                            </p>
                            <p className="text-sm text-zinc-500">Informativos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts lists */}
            <AlertsList
                unresolvedAlerts={unresolvedAlerts}
                resolvedAlerts={resolvedAlerts}
            />
        </>
    )
}

function AlertsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-zinc-800 rounded animate-pulse" />
                            <div>
                                <div className="h-8 w-8 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-4 w-16 bg-zinc-800 rounded mt-1 animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="p-4 border-b border-zinc-800">
                    <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-zinc-800">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-3 h-3 bg-zinc-800 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function AlertsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                    <AlertTriangle className="h-7 w-7 text-orange-500" />
                    Alertas do Sistema
                </h1>
                <p className="text-zinc-400 mt-1">
                    Gerencie alertas e notificacoes do sistema
                </p>
            </div>

            {/* Content */}
            <Suspense fallback={<AlertsSkeleton />}>
                <AlertsContent />
            </Suspense>
        </div>
    )
}
