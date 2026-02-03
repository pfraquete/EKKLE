'use client'

import { Building2, AlertTriangle, History, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
    recentChurches: Array<{
        id: string
        name: string
        created_at: string
        logo_url: string | null
    }>
    unresolvedAlerts: Array<{
        id: string
        alert_type: 'critical' | 'warning' | 'info'
        title: string
        created_at: string
    }>
    recentAudit: Array<{
        id: string
        action: string
        target_type: string
        created_at: string
        admin?: { full_name: string; email: string }
    }>
}

export function RecentActivity({ recentChurches, unresolvedAlerts, recentAudit }: RecentActivityProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Churches */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        Igrejas Recentes
                    </h3>
                    <Link
                        href="/admin/churches"
                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                    >
                        Ver todas
                        <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="divide-y divide-zinc-800">
                    {recentChurches.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-sm">
                            Nenhuma igreja recente
                        </div>
                    ) : (
                        recentChurches.map((church) => (
                            <Link
                                key={church.id}
                                href={`/admin/churches/${church.id}`}
                                className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
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
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-200 truncate">
                                        {church.name}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {formatDistanceToNow(new Date(church.created_at), {
                                            addSuffix: true,
                                            locale: ptBR
                                        })}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Unresolved Alerts */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Alertas Pendentes
                    </h3>
                    <Link
                        href="/admin/alerts"
                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                    >
                        Ver todos
                        <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="divide-y divide-zinc-800">
                    {unresolvedAlerts.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-sm">
                            Nenhum alerta pendente
                        </div>
                    ) : (
                        unresolvedAlerts.map((alert) => (
                            <Link
                                key={alert.id}
                                href="/admin/alerts"
                                className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className={cn(
                                    'w-2 h-2 rounded-full flex-shrink-0',
                                    alert.alert_type === 'critical' && 'bg-red-500',
                                    alert.alert_type === 'warning' && 'bg-yellow-500',
                                    alert.alert_type === 'info' && 'bg-blue-500'
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-200 truncate">
                                        {alert.title}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {formatDistanceToNow(new Date(alert.created_at), {
                                            addSuffix: true,
                                            locale: ptBR
                                        })}
                                    </p>
                                </div>
                                <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    alert.alert_type === 'critical' && 'bg-red-500/20 text-red-400',
                                    alert.alert_type === 'warning' && 'bg-yellow-500/20 text-yellow-400',
                                    alert.alert_type === 'info' && 'bg-blue-500/20 text-blue-400'
                                )}>
                                    {alert.alert_type}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-500" />
                        Atividade Recente
                    </h3>
                    <Link
                        href="/admin/audit"
                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                    >
                        Ver todos
                        <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="divide-y divide-zinc-800">
                    {recentAudit.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-sm">
                            Nenhuma atividade recente
                        </div>
                    ) : (
                        recentAudit.map((log) => (
                            <div
                                key={log.id}
                                className="p-3"
                            >
                                <p className="text-sm text-zinc-200">
                                    <span className="font-medium">
                                        {log.admin?.full_name || 'Admin'}
                                    </span>
                                    {' '}
                                    <span className="text-zinc-400">
                                        {formatAction(log.action)}
                                    </span>
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {formatDistanceToNow(new Date(log.created_at), {
                                        addSuffix: true,
                                        locale: ptBR
                                    })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function formatAction(action: string): string {
    const actionMap: Record<string, string> = {
        'church.view': 'visualizou uma igreja',
        'church.update': 'atualizou uma igreja',
        'church.suspend': 'suspendeu uma igreja',
        'church.reactivate': 'reativou uma igreja',
        'church.delete': 'deletou uma igreja',
        'subscription.view': 'visualizou assinatura',
        'subscription.cancel': 'cancelou assinatura',
        'setting.update': 'atualizou configuracao',
        'feature_flag.create': 'criou feature flag',
        'feature_flag.update': 'atualizou feature flag',
        'integration.check': 'verificou integracao',
        'alert.resolve': 'resolveu alerta'
    }
    return actionMap[action] || action
}

export function RecentActivitySkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {[...Array(5)].map((_, j) => (
                            <div key={j} className="p-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
