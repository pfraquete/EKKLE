import { getPastorDashboardData, getAllCellsOverview, getGrowthData } from '@/actions/admin'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    Home,
    AlertCircle,
    TrendingUp,
    Plus
} from 'lucide-react'
import Link from 'next/link'
import { CellsList } from '@/components/dashboard/cells-list'
import { GrowthChart } from '@/components/dashboard/growth-chart'

export default async function DashboardPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // If role is LEADER, redirect to their cell page
    if (profile.role === 'LEADER') {
        redirect('/minha-celula')
    }

    // Only PASTOR continues here
    const { stats } = await getPastorDashboardData(profile.church_id)
    const cells = await getAllCellsOverview(profile.church_id)
    const growthData = await getGrowthData(profile.church_id)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Visão Geral</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Painel Pastoral • Ekkle</p>
                </div>
                <Link href="/celulas/nova">
                    <Button className="rounded-2xl shadow-lg h-11 px-6 font-bold">
                        <Plus className="h-5 w-5 mr-2" />
                        Nova Célula
                    </Button>
                </Link>
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

            {/* Growth Chart */}
            <GrowthChart data={growthData} />

            {/* Cells List with Search */}
            <CellsList cells={cells} />

            {/* Footer Info */}
            <div className="flex items-center justify-between px-2 opacity-40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px]">MVP Célula v1.0 • Ekkle</p>
            </div>
        </div>
    )
}
