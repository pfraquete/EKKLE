import { getPastorDashboardData, getAllCellsOverview, getGrowthData, getExtendedDashboardStats } from '@/actions/admin'
import { getWhatsAppInstance } from '@/actions/whatsapp'
export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    Home,
    AlertCircle,
    TrendingUp,
    Plus,
    MessageSquare,
    BookOpen,
    ShoppingBag,
    CalendarCheck
} from 'lucide-react'
import Link from 'next/link'
import { CellsList } from '@/components/dashboard/cells-list'
import { GrowthChart } from '@/components/dashboard/growth-chart'
// import { GuidedTour } from '@/components/dashboard/guided-tour'
import { getEvents } from '@/actions/admin'
import { Calendar, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency } from '@/lib/utils'

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
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white-primary">Visão Geral</h1>
                    <p className="text-sm text-gray-text-secondary font-medium tracking-tight">Painel Pastoral • Ekkle</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/configuracoes/whatsapp" className="hidden sm:block">
                        <Button
                            variant={whatsapp?.status === 'CONNECTED' ? 'secondary' : 'outline'}
                            className={cn(
                                "rounded-2xl h-11 px-4 font-bold",
                                whatsapp?.status === 'CONNECTED' 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                                    : ""
                            )}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            {whatsapp?.status === 'CONNECTED' ? 'WhatsApp Ativo' : 'Configurar Zap'}
                        </Button>
                    </Link>
                    <Link href="/importar" className="hidden sm:block">
                        <Button variant="outline" className="rounded-2xl h-11 px-4 font-bold">
                            <Download className="h-5 w-5 mr-2" />
                            Importar
                        </Button>
                    </Link>
                    <Link href="/celulas/nova" className="flex-1 sm:flex-none">
                        <Button className="rounded-2xl h-11 px-6 font-bold w-full sm:w-auto shadow-gold-glow hover:shadow-gold-glow-strong">
                            <Plus className="h-5 w-5 mr-2" />
                            Nova Célula
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Grid - Primary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="group">
                    <CardContent className="p-5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                            <Users className="h-6 w-6" />
                        </div>
                        <p className="text-3xl font-black text-white-primary leading-none">{stats.totalMembers}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Membros</p>
                    </CardContent>
                </Card>

                <Card className="group">
                    <CardContent className="p-5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                            <Home className="h-6 w-6" />
                        </div>
                        <p className="text-3xl font-black text-white-primary leading-none">{stats.totalCells}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Células</p>
                    </CardContent>
                </Card>

                <Card className="group">
                    <CardContent className="p-5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <p className="text-3xl font-black text-gold leading-none">{stats.overallAttendance}%</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Presença Global</p>
                    </CardContent>
                </Card>

                <Card className="group">
                    <CardContent className="p-5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-red-500/20 transition-colors">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <p className="text-3xl font-black text-white-primary leading-none">{stats.cellsWithoutReports}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Sem Relatório</p>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Grid - Secondary Metrics (Courses, Orders, Events) */}
            {extendedStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/cursos">
                        <Card className="group h-full">
                            <CardContent className="p-5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <p className="text-3xl font-black text-white-primary leading-none">{extendedStats.courses.totalEnrollments}</p>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Matrículas</p>
                                <p className="text-xs text-gray-text-muted mt-1">{extendedStats.courses.publishedCourses} cursos ativos</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/loja">
                        <Card className="group h-full">
                            <CardContent className="p-5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <p className="text-3xl font-black text-white-primary leading-none">{extendedStats.orders.paidOrders}</p>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Pedidos Pagos</p>
                                <p className="text-xs text-gold mt-1">{formatCurrency(extendedStats.orders.totalRevenueCents / 100)}</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/eventos">
                        <Card className="group h-full">
                            <CardContent className="p-5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-cyan-500/20 transition-colors">
                                    <CalendarCheck className="h-6 w-6" />
                                </div>
                                <p className="text-3xl font-black text-white-primary leading-none">{extendedStats.events.upcomingEvents}</p>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Eventos Próximos</p>
                                <p className="text-xs text-gray-text-muted mt-1">{extendedStats.events.totalRegistrations} inscrições</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {extendedStats.orders.pendingOrders > 0 && (
                        <Link href="/dashboard/loja">
                            <Card className="group h-full border-l-2 border-l-amber-500">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    <p className="text-3xl font-black text-white-primary leading-none">{extendedStats.orders.pendingOrders}</p>
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-text-secondary mt-2">Pedidos Pendentes</p>
                                    <p className="text-xs text-amber-400 mt-1">Aguardando pagamento</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            )}

            {/* Activities & Growth */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <GrowthChart data={growthData} />
                </div>
                <div className="space-y-4">
                    <Card className="h-full">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-text-secondary">Próximos Eventos</p>
                                <Link href="/calendario">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold-light">Ver Tudo</Button>
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                                    <div key={event.id} className="flex gap-4 p-3 rounded-xl hover:bg-black-elevated transition-colors">
                                        <div className="w-12 h-12 bg-black-elevated rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-gray-border">
                                            <span className="text-[10px] font-black uppercase leading-none text-gold">{format(new Date(event.start_date), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-lg font-black leading-none text-white-primary">{format(new Date(event.start_date), 'dd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white-primary truncate">{event.title}</p>
                                            <p className="text-xs text-gray-text-muted flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(event.start_date), "EEEE 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-black-elevated rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Calendar className="h-8 w-8 text-gray-text-muted" />
                                        </div>
                                        <p className="text-sm text-gray-text-secondary font-medium">Nenhum evento agendado</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cells List with Search */}
            <CellsList cells={cells} />

            {/* Footer Info */}
            <div className="flex items-center justify-center px-2">
                <p className="text-xs font-bold text-gray-text-muted uppercase tracking-[3px]">Ekkle • Sistema de Gestão de Igrejas</p>
            </div>
        </div>
    )
}
