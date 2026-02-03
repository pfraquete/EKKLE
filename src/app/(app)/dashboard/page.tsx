import { getPastorDashboardData, getAllCellsOverview, getGrowthData, getExtendedDashboardStats } from '@/actions/admin'
import { getWhatsAppInstance } from '@/actions/whatsapp'
export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import {
    Users,
    Home,
    AlertCircle,
    TrendingUp,
    BookOpen,
    ShoppingBag,
    CalendarCheck
} from 'lucide-react'
import { getEvents } from '@/actions/admin'
import { formatCurrency } from '@/lib/utils'

// Modern Components
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { ModernGrowthChart } from '@/components/dashboard/modern-growth-chart'
import { UpcomingEventsCard } from '@/components/dashboard/upcoming-events-card'
import { ModernCellsList } from '@/components/dashboard/modern-cells-list'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // MEMBER with cell should use member area
    // MEMBER without cell can access dashboard to choose a cell
    if (profile.role === 'MEMBER' && profile.cell_id) {
        redirect('/membro')
    }
    const [
        { stats },
        cells,
        growthData,
        events,
        { data: whatsapp },
        extendedStats
    ] = await Promise.all([
        getPastorDashboardData(),
        getAllCellsOverview(),
        getGrowthData(),
        getEvents(),
        getWhatsAppInstance(),
        getExtendedDashboardStats()
    ])

    const upcomingEvents = events
        .filter(e => new Date(e.start_date) >= new Date())
        .slice(0, 3)

    return (
        <div className="space-y-6 pb-20">
            {/* Modern Header with Greeting */}
            <DashboardHeader 
                churchName={(profile as any).church?.name}
                whatsappStatus={whatsapp?.status}
                pendingAlerts={stats.cellsWithoutReports}
            />

            {/* Quick Actions */}
            <QuickActions />

            {/* Primary KPIs - Glassmorphism Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Membros"
                    value={stats.totalMembers}
                    icon={Users}
                    color="blue"
                    trend={stats.totalMembers > 0 ? { value: 12, isPositive: true } : undefined}
                />
                <StatCard
                    title="Células"
                    value={stats.totalCells}
                    icon={Home}
                    color="indigo"
                />
                <StatCard
                    title="Presença Global"
                    value={`${stats.overallAttendance}%`}
                    icon={TrendingUp}
                    color="gold"
                />
                <StatCard
                    title="Sem Relatório"
                    value={stats.cellsWithoutReports}
                    icon={AlertCircle}
                    color={stats.cellsWithoutReports > 0 ? 'red' : 'emerald'}
                    subtitle={stats.cellsWithoutReports > 0 ? 'Atenção necessária' : 'Tudo em dia!'}
                />
            </div>

            {/* Secondary KPIs - Extended Stats */}
            {extendedStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Matrículas"
                        value={extendedStats.courses.totalEnrollments}
                        subtitle={`${extendedStats.courses.publishedCourses} cursos ativos`}
                        icon={BookOpen}
                        color="purple"
                        href="/dashboard/cursos"
                    />
                    <StatCard
                        title="Pedidos Pagos"
                        value={extendedStats.orders.paidOrders}
                        subtitle={formatCurrency(extendedStats.orders.totalRevenueCents / 100)}
                        icon={ShoppingBag}
                        color="orange"
                        href="/dashboard/loja"
                    />
                    <StatCard
                        title="Eventos Próximos"
                        value={extendedStats.events.upcomingEvents}
                        subtitle={`${extendedStats.events.totalRegistrations} inscrições`}
                        icon={CalendarCheck}
                        color="cyan"
                        href="/dashboard/eventos"
                    />
                    {extendedStats.orders.pendingOrders > 0 && (
                        <StatCard
                            title="Pedidos Pendentes"
                            value={extendedStats.orders.pendingOrders}
                            subtitle="Aguardando pagamento"
                            icon={AlertCircle}
                            color="amber"
                            href="/dashboard/loja"
                        />
                    )}
                </div>
            )}

            {/* Charts & Events Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ModernGrowthChart data={growthData} />
                </div>
                <div>
                    <UpcomingEventsCard events={upcomingEvents} />
                </div>
            </div>

            {/* Cells Management */}
            <ModernCellsList cells={cells} />

            {/* Footer */}
            <div className="flex items-center justify-center px-2 pt-8">
                <div className="flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-border" />
                    <p className="text-xs font-bold text-gray-text-muted uppercase tracking-[0.2em]">
                        Ekkle • Sistema de Gestão de Igrejas
                    </p>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-border" />
                </div>
            </div>
        </div>
    )
}
