'use client'

import {
    Building2,
    CreditCard,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Puzzle,
    DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/actions/super-admin/dashboard'

interface KPICardsProps {
    stats: DashboardStats
}

interface KPICardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ElementType
    trend?: {
        value: number
        label: string
        positive?: boolean
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: KPICardProps) {
    const variantStyles = {
        default: 'bg-zinc-900 border-zinc-800',
        success: 'bg-emerald-500/10 border-emerald-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        danger: 'bg-red-500/10 border-red-500/20'
    }

    const iconStyles = {
        default: 'text-zinc-400 bg-zinc-800',
        success: 'text-emerald-400 bg-emerald-500/20',
        warning: 'text-yellow-400 bg-yellow-500/20',
        danger: 'text-red-400 bg-red-500/20'
    }

    return (
        <div className={cn(
            'rounded-xl border p-5 transition-all duration-200 hover:shadow-lg',
            variantStyles[variant]
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-zinc-100">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend.positive ? (
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <span className={cn(
                                'text-xs font-medium',
                                trend.positive ? 'text-emerald-400' : 'text-red-400'
                            )}>
                                {trend.value > 0 ? '+' : ''}{trend.value}%
                            </span>
                            <span className="text-xs text-zinc-500">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    'p-3 rounded-lg',
                    iconStyles[variant]
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

export function KPICards({ stats }: KPICardsProps) {
    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Churches */}
            <KPICard
                title="Igrejas"
                value={stats.churches.total}
                subtitle={`${stats.churches.active} ativas, ${stats.churches.suspended} suspensas`}
                icon={Building2}
                trend={stats.churches.growth !== 0 ? {
                    value: stats.churches.growth,
                    label: 'vs mes anterior',
                    positive: stats.churches.growth > 0
                } : undefined}
            />

            {/* MRR */}
            <KPICard
                title="MRR"
                value={formatCurrency(stats.subscriptions.mrr)}
                subtitle={`ARR: ${formatCurrency(stats.subscriptions.arr)}`}
                icon={DollarSign}
                variant="success"
            />

            {/* Users */}
            <KPICard
                title="Usuarios"
                value={stats.users.total.toLocaleString('pt-BR')}
                subtitle={`+${stats.users.thisMonth} este mes`}
                icon={Users}
            />

            {/* Subscriptions */}
            <KPICard
                title="Assinaturas Ativas"
                value={stats.subscriptions.active}
                subtitle={`${stats.subscriptions.trialing} em trial`}
                icon={CreditCard}
                variant="success"
            />

            {/* Alerts */}
            {stats.alerts.unresolved > 0 && (
                <KPICard
                    title="Alertas"
                    value={stats.alerts.unresolved}
                    subtitle={`${stats.alerts.critical} criticos, ${stats.alerts.warning} warnings`}
                    icon={AlertTriangle}
                    variant={stats.alerts.critical > 0 ? 'danger' : 'warning'}
                />
            )}

            {/* Integrations */}
            {stats.integrations.down > 0 && (
                <KPICard
                    title="Integracoes"
                    value={`${stats.integrations.down} offline`}
                    subtitle={`${stats.integrations.healthy} de ${stats.integrations.total} funcionando`}
                    icon={Puzzle}
                    variant="danger"
                />
            )}
        </div>
    )
}

export function KPICardsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                            <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="w-11 h-11 bg-zinc-800 rounded-lg animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}
