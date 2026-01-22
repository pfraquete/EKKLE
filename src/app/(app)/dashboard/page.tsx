import { getPastorDashboardData, getAllCellsOverview, getGrowthData } from '@/actions/admin'
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
    MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { CellsList } from '@/components/dashboard/cells-list'
import { GrowthChart } from '@/components/dashboard/growth-chart'
// import { GuidedTour } from '@/components/dashboard/guided-tour'
import { getEvents } from '@/actions/admin'
import { Calendar, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // If role is LEADER, redirect to their cell page
    if (profile.role === 'LEADER') {
        redirect('/minha-celula')
    }

    // Only PASTOR continues here
    const { stats } = await getPastorDashboardData()
    const cells = await getAllCellsOverview()
    const growthData = await getGrowthData()
    const events = await getEvents()
    const { data: whatsapp } = await getWhatsAppInstance()

    const upcomingEvents = events
        .filter(e => new Date(e.start_date) >= new Date())
        .slice(0, 3)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Visão Geral</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Painel Pastoral • Ekkle</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/configuracoes/whatsapp">
                        <Button
                            variant={whatsapp?.status === 'CONNECTED' ? 'secondary' : 'outline'}
                            className={cn(
                                "rounded-2xl h-11 px-4 font-bold border-2",
                                whatsapp?.status === 'CONNECTED' ? "bg-green-500/10 text-green-500 border-green-500/20" : "border-2"
                            )}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            {whatsapp?.status === 'CONNECTED' ? 'WhatsApp Ativo' : 'Configurar Zap'}
                        </Button>
                    </Link>
                    <Link href="/importar">
                        <Button variant="outline" className="rounded-2xl h-11 px-4 font-bold border-2">
                            <Download className="h-5 w-5 mr-2" />
                            Importar
                        </Button>
                    </Link>
                    <Link href="/celulas/nova">
                        <Button className="rounded-2xl shadow-lg h-11 px-6 font-bold">
                            <Plus className="h-5 w-5 mr-2" />
                            Nova Célula
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-3">
                            <Users className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none">{stats.totalMembers}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2">Membros</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                            <Home className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none">{stats.totalCells}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2">Células</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-3">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none">{stats.overallAttendance}%</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2">Presença Global</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mb-3">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none">{stats.cellsWithoutReports}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2">Sem Relatório</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activities & Growth */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <GrowthChart data={growthData} />
                </div>
                <div className="space-y-4">
                    <Card className="border-none shadow-sm h-full">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Próximos Eventos</p>
                                <Link href="/calendario">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-blue-600">Ver Tudo</Button>
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="w-10 h-10 bg-muted rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black uppercase leading-none">{format(new Date(event.start_date), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-md font-black leading-none">{format(new Date(event.start_date), 'dd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{event.title}</p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(event.start_date), "EEEE 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-6">
                                        <Calendar className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">Nenhum evento agendado</p>
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
            <div className="flex items-center justify-between px-2 opacity-40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px]">MVP Célula v1.0 • Ekkle</p>
            </div>
        </div>
    )
}
