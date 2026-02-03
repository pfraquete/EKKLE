import { Suspense } from 'react'
import { getAdminDashboardStats, getRecentActivity } from '@/actions/super-admin/dashboard'
import { getIntegrationStatuses } from '@/actions/super-admin/integrations'
import {
    KPICards,
    KPICardsSkeleton,
    RecentActivity,
    RecentActivitySkeleton,
    IntegrationsWidget,
    IntegrationsWidgetSkeleton
} from '@/components/admin/dashboard'

export const metadata = {
    title: 'Admin Dashboard | Ekkle',
    description: 'Painel administrativo do Ekkle'
}

async function DashboardKPIs() {
    const stats = await getAdminDashboardStats()
    return <KPICards stats={stats} />
}

async function DashboardIntegrations() {
    const integrations = await getIntegrationStatuses()
    return <IntegrationsWidget integrations={integrations} />
}

async function DashboardActivity() {
    const activity = await getRecentActivity()
    return (
        <RecentActivity
            recentChurches={activity.recentChurches}
            unresolvedAlerts={activity.unresolvedAlerts}
            recentAudit={activity.recentAudit}
        />
    )
}

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
                <p className="text-zinc-400 mt-1">
                    Visao geral do sistema Ekkle
                </p>
            </div>

            {/* KPI Cards */}
            <Suspense fallback={<KPICardsSkeleton />}>
                <DashboardKPIs />
            </Suspense>

            {/* Integrations Status */}
            <Suspense fallback={<IntegrationsWidgetSkeleton />}>
                <DashboardIntegrations />
            </Suspense>

            {/* Recent Activity */}
            <Suspense fallback={<RecentActivitySkeleton />}>
                <DashboardActivity />
            </Suspense>
        </div>
    )
}
