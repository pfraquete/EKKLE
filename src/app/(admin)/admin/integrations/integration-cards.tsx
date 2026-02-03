'use client'

import { useState, useTransition } from 'react'
import {
    CreditCard,
    MessageCircle,
    Video,
    Radio,
    Mail,
    Bot,
    ShoppingBag,
    CheckCircle2,
    AlertCircle,
    XCircle,
    HelpCircle,
    RefreshCw,
    Clock,
    ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { checkIntegrationHealth, checkAllIntegrationsHealth } from '@/actions/super-admin/integrations'

interface IntegrationData {
    id: string
    provider: string
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
    last_check_at: string | null
    last_success_at: string | null
    error_message: string | null
    metrics: Record<string, any>
    config: {
        name: string
        description: string
        icon: string
    }
}

interface IntegrationCardsProps {
    integrations: IntegrationData[]
}

const ICON_MAP: Record<string, typeof CreditCard> = {
    'credit-card': CreditCard,
    'message-circle': MessageCircle,
    'video': Video,
    'radio': Radio,
    'mail': Mail,
    'bot': Bot,
    'shopping-bag': ShoppingBag,
    'puzzle': HelpCircle
}

const STATUS_CONFIG = {
    healthy: {
        icon: CheckCircle2,
        label: 'Operacional',
        bgClass: 'bg-emerald-500/20',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/30'
    },
    degraded: {
        icon: AlertCircle,
        label: 'Degradado',
        bgClass: 'bg-yellow-500/20',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-500/30'
    },
    down: {
        icon: XCircle,
        label: 'Offline',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
        borderClass: 'border-red-500/30'
    },
    unknown: {
        icon: HelpCircle,
        label: 'Desconhecido',
        bgClass: 'bg-zinc-500/20',
        textClass: 'text-zinc-400',
        borderClass: 'border-zinc-500/30'
    }
}

export function IntegrationCards({ integrations }: IntegrationCardsProps) {
    const [localIntegrations, setLocalIntegrations] = useState(integrations)
    const [checkingAll, setCheckingAll] = useState(false)
    const [checkingProvider, setCheckingProvider] = useState<string | null>(null)

    const handleCheckSingle = async (provider: string) => {
        setCheckingProvider(provider)
        try {
            const result = await checkIntegrationHealth(provider)
            setLocalIntegrations(prev => prev.map(int => {
                if (int.provider === provider) {
                    return {
                        ...int,
                        status: result.status,
                        last_check_at: new Date().toISOString(),
                        error_message: result.error || null,
                        metrics: { ...int.metrics, latency: result.latency }
                    }
                }
                return int
            }))
        } catch (error) {
            console.error('Failed to check integration:', error)
        }
        setCheckingProvider(null)
    }

    const handleCheckAll = async () => {
        setCheckingAll(true)
        try {
            const results = await checkAllIntegrationsHealth()
            setLocalIntegrations(prev => prev.map(int => {
                const result = results[int.provider]
                const newStatus = result?.status as IntegrationData['status'] | undefined
                return {
                    ...int,
                    status: newStatus || int.status,
                    last_check_at: new Date().toISOString(),
                    error_message: result?.error || null,
                    metrics: { ...int.metrics, latency: result?.latency }
                }
            }))
        } catch (error) {
            console.error('Failed to check all integrations:', error)
        }
        setCheckingAll(false)
    }

    return (
        <div className="space-y-4">
            {/* Check all button */}
            <div className="flex justify-end">
                <button
                    onClick={handleCheckAll}
                    disabled={checkingAll}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn('h-4 w-4', checkingAll && 'animate-spin')} />
                    {checkingAll ? 'Verificando...' : 'Verificar Todas'}
                </button>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localIntegrations.map((integration) => {
                    const statusConfig = STATUS_CONFIG[integration.status]
                    const StatusIcon = statusConfig.icon
                    const ProviderIcon = ICON_MAP[integration.config.icon] || HelpCircle
                    const isChecking = checkingProvider === integration.provider

                    return (
                        <div
                            key={integration.id}
                            className={cn(
                                'rounded-xl border bg-zinc-900 p-6 transition-all duration-200',
                                statusConfig.borderClass
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-zinc-800">
                                        <ProviderIcon className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-100">
                                            {integration.config.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500">
                                            {integration.config.description}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                    statusConfig.bgClass,
                                    statusConfig.textClass
                                )}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusConfig.label}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                {integration.last_check_at && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-zinc-500" />
                                        <span className="text-zinc-400">
                                            Verificado {formatDistanceToNow(new Date(integration.last_check_at), {
                                                addSuffix: true,
                                                locale: ptBR
                                            })}
                                        </span>
                                    </div>
                                )}

                                {integration.metrics?.latency && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-zinc-500">Latencia:</span>
                                        <span className={cn(
                                            integration.metrics.latency > 1000 ? 'text-yellow-400' : 'text-zinc-300'
                                        )}>
                                            {integration.metrics.latency}ms
                                        </span>
                                    </div>
                                )}

                                {integration.error_message && (
                                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-xs text-red-400">
                                            {integration.error_message}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCheckSingle(integration.provider)}
                                    disabled={isChecking}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
                                    {isChecking ? 'Verificando...' : 'Verificar'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
