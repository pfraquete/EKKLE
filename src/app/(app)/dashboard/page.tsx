import { getPastorDashboardData, getAllCellsOverview } from '@/actions/admin'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Home,
    AlertCircle,
    TrendingUp,
    Plus,
    ChevronRight,
    Search,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Visão Geral</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">Painel Pastoral • Videira SJC</p>
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
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                            <Users className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalMembers}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2">Membros</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                            <Home className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalCells}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2">Células</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 leading-none">{stats.overallAttendance}%</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2">Presença Global</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 leading-none">{stats.cellsWithoutReports}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2">Sem Relatório</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-gray-50/50 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">Gerenciamento de Células</CardTitle>
                            <CardDescription>Acompanhe o desempenho de cada grupo</CardDescription>
                        </div>
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar célula ou líder..."
                                className="pl-10 h-10 bg-white rounded-xl border-gray-100"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {cells.length === 0 ? (
                            <div className="p-20 text-center">
                                <Home className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Nenhuma célula cadastrada.</p>
                            </div>
                        ) : (
                            cells.map(cell => (
                                <Link
                                    key={cell.id}
                                    href={`/celulas/${cell.id}`}
                                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg
                      ${cell.hasRecentReport ? 'bg-primary' : 'bg-amber-400 shadow-amber-200'}
                    `}>
                                            {cell.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{cell.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Líder: {cell.leaderName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-sm font-bold text-gray-900">{cell.membersCount} membros</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">
                                                {cell.lastMeetingDate ? format(new Date(cell.lastMeetingDate), "dd MMM", { locale: ptBR }) : 'Sem reunião'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {cell.hasRecentReport ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-amber-500" />
                                            )}
                                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Footer Info */}
            <div className="flex items-center justify-between px-2 opacity-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">MVP Célula v1.0 • Videira SJC</p>
            </div>
        </div>
    )
}
