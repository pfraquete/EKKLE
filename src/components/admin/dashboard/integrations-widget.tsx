'use client'

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
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { checkAllIntegrationsHealth } from '@/actions/super-admin/integrations'

interface IntegrationStatus {
    id: string
    provider: string
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
    last_check_at: string | null
    error_message: string | null
}

interface IntegrationsWidgetProps {
    integrations: IntegrationStatus[]
}

const PROVIDER_CONFIG: Record<string, { name: string; icon: typeof CreditCard }> = {
    stripe: { name: 'Stripe', icon: CreditCard },
    evolution: { name: 'Evolution', icon: MessageCircle },
    mux: { name: 'Mux', icon: Video },
    livekit: { name: 'LiveKit', icon: Radio },
    resend: { name: 'Resend', icon: Mail },
    openai: { name: 'OpenAI', icon: Bot },
    pagarme: { name: 'Pagar.me', icon: ShoppingBag }
}

const STATUS_CONFIG = {
    healthy: {
        icon: CheckCircle2,
        label: 'Operacional',
        className: 'text-emerald-400 bg-emerald-500/20'
    },
    degraded: {
        icon: AlertCircle,
        label: 'Degradado',
        className: 'text-yellow-400 bg-yellow-500/20'
    },
    down: {
        icon: XCircle,
        label: 'Offline',
        className: 'text-red-400 bg-red-500/20'
    },
    unknown: {
        icon: HelpCircle,
        label: 'Desconhecido',
        className: 'text-zinc-400 bg-zinc-500/20'
    }
}

export function IntegrationsWidget({ integrations }: IntegrationsWidgetProps) {
    const [isPending, startTransition] = useTransition()
    const [localIntegrations, setLocalIntegrations] = useState(integrations)

    const handleRefresh = () => {
        startTransition(async () => {
            try {
                const results = await checkAllIntegrationsHealth()
                // Update local state with new statuses
                setLocalIntegrations(prev => prev.map(int => {
                    const result = results[int.provider]
                    const newStatus = result?.status as IntegrationStatus['status'] | undefined
                    return {
                        ...int,
                        status: newStatus || int.status,
                        last_check_at: new Date().toISOString(),
                        error_message: result?.error || null
                    }
                }))
            } catch (error) {
                console.error('Failed to refresh integrations:', error)
            }
        })
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-100">Status das Integracoes</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isPending}
                        className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
                    </button>
                    <Link
                        href="/admin/integrations"
                        className="text-xs text-orange-500 hover:text-orange-400"
                    >
                        Ver detalhes
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-x divide-zinc-800">
                {localIntegrations.map((integration) => {
                    const config = PROVIDER_CONFIG[integration.provider] || {
                        name: integration.provider,
                        icon: HelpCircle
                    }
                    const statusConfig = STATUS_CONFIG[integration.status]
                    const Icon = config.icon
                    const StatusIcon = statusConfig.icon

                    return (
                        <div
                            key={integration.id}
                            className="p-4 hover:bg-zinc-800/50 transition-colors"
                            title={integration.error_message || statusConfig.label}
                        >
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="relative">
                                    <div className="p-2 rounded-lg bg-zinc-800">
                                        <Icon className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <div className={cn(
                                        'absolute -bottom-1 -right-1 p-0.5 rounded-full',
                                        statusConfig.className
                                    )}>
                                        <StatusIcon className="h-3 w-3" />
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-zinc-300">
                                    {config.name}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function IntegrationsWidgetSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
                <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-x divide-zinc-800">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="p-4 flex flex-col items-center gap-2">
                        <div className="w-9 h-9 bg-zinc-800 rounded-lg animate-pulse" />
                        <div className="h-3 w-12 bg-zinc-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
}
