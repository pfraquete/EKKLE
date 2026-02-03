'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, Info, AlertCircle, Clock, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { resolveAlert } from '@/actions/super-admin/audit'

interface Alert {
    id: string
    alert_type: 'critical' | 'warning' | 'info'
    category: string
    title: string
    description: string | null
    is_resolved: boolean
    resolved_at: string | null
    created_at: string
}

interface AlertsListProps {
    unresolvedAlerts: Alert[]
    resolvedAlerts: Alert[]
}

const ALERT_CONFIG = {
    critical: {
        icon: AlertCircle,
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/30',
        textClass: 'text-red-400',
        dotClass: 'bg-red-500'
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-yellow-500/10',
        borderClass: 'border-yellow-500/30',
        textClass: 'text-yellow-400',
        dotClass: 'bg-yellow-500'
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/30',
        textClass: 'text-blue-400',
        dotClass: 'bg-blue-500'
    }
}

export function AlertsList({ unresolvedAlerts, resolvedAlerts }: AlertsListProps) {
    const [localUnresolved, setLocalUnresolved] = useState(unresolvedAlerts)
    const [isPending, startTransition] = useTransition()
    const [resolvingId, setResolvingId] = useState<string | null>(null)

    const handleResolve = async (alertId: string) => {
        setResolvingId(alertId)
        startTransition(async () => {
            try {
                await resolveAlert(alertId)
                setLocalUnresolved(prev => prev.filter(a => a.id !== alertId))
            } catch (error) {
                console.error('Failed to resolve alert:', error)
            }
            setResolvingId(null)
        })
    }

    return (
        <div className="space-y-6">
            {/* Unresolved Alerts */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="font-semibold text-zinc-100">
                        Alertas Pendentes ({localUnresolved.length})
                    </h2>
                </div>
                <div className="divide-y divide-zinc-800">
                    {localUnresolved.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                            <p className="text-zinc-400">Nenhum alerta pendente</p>
                        </div>
                    ) : (
                        localUnresolved.map((alert) => {
                            const config = ALERT_CONFIG[alert.alert_type]
                            const Icon = config.icon
                            const isResolving = resolvingId === alert.id

                            return (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        'p-4 flex items-start gap-4 transition-colors',
                                        config.bgClass
                                    )}
                                >
                                    <div className={cn(
                                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                        config.dotClass
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-zinc-100">
                                                    {alert.title}
                                                </p>
                                                {alert.description && (
                                                    <p className="text-sm text-zinc-400 mt-1">
                                                        {alert.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={cn(
                                                        'text-xs px-2 py-0.5 rounded-full font-medium',
                                                        config.bgClass,
                                                        config.textClass
                                                    )}>
                                                        {alert.alert_type}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(alert.created_at), {
                                                            addSuffix: true,
                                                            locale: ptBR
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleResolve(alert.id)}
                                                disabled={isPending}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {isResolving ? (
                                                    'Resolvendo...'
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4" />
                                                        Resolver
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Resolved Alerts */}
            {resolvedAlerts.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="font-semibold text-zinc-100">
                            Alertas Resolvidos (Ultimos 20)
                        </h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {resolvedAlerts.map((alert) => {
                            const config = ALERT_CONFIG[alert.alert_type]

                            return (
                                <div
                                    key={alert.id}
                                    className="p-4 flex items-start gap-4 opacity-60"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-zinc-300 line-through">
                                            {alert.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-zinc-500">
                                                Resolvido {alert.resolved_at && formatDistanceToNow(
                                                    new Date(alert.resolved_at),
                                                    { addSuffix: true, locale: ptBR }
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
