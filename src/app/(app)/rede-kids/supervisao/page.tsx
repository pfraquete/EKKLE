import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getSupervisionCells, KidsCell } from '@/actions/kids-cells'
import { getKidsChildren } from '@/actions/kids-children'
import { getUpcomingKidsMeetings, getKidsMeetingsStats } from '@/actions/kids-meetings'
import { getKidsNetworkMembers } from '@/actions/kids-network'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Shield,
    Home,
    Users,
    Baby,
    Calendar,
    ChevronRight,
    Clock,
    MapPin,
    BookOpen,
    Plus
} from 'lucide-react'

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

interface CellWithStats extends KidsCell {
    childrenCount: number
    membersCount: number
    upcomingMeetingsCount: number
    completedMeetingsCount: number
}

export default async function SupervisaoPage() {
    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    // Only Discipuladora Kids, Pastora Kids or Pastor can access
    const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
    const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
    const isPastor = profile.role === 'PASTOR'

    if (!isDiscipuladoraKids && !isPastoraKids && !isPastor) {
        redirect('/rede-kids')
    }

    // Get supervised cells
    const cells = await getSupervisionCells()
    const allMembers = await getKidsNetworkMembers()

    // Get stats for each cell
    const cellsWithStats: CellWithStats[] = await Promise.all(
        cells.map(async (cell) => {
            const [children, meetingsStats] = await Promise.all([
                getKidsChildren({ cellId: cell.id }),
                getKidsMeetingsStats(cell.id)
            ])

            const cellMembers = allMembers.filter(m => m.kids_cell_id === cell.id)

            return {
                ...cell,
                childrenCount: children.length,
                membersCount: cellMembers.length,
                upcomingMeetingsCount: meetingsStats?.upcoming || 0,
                completedMeetingsCount: meetingsStats?.completed || 0
            }
        })
    )

    // Get all upcoming meetings across supervised cells
    const upcomingMeetings = await Promise.all(
        cells.map(cell => getUpcomingKidsMeetings(cell.id, 2))
    ).then(results => results.flat().sort((a, b) =>
        new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
    ).slice(0, 5))

    // Calculate totals
    const totalChildren = cellsWithStats.reduce((sum, c) => sum + c.childrenCount, 0)
    const totalMembers = cellsWithStats.reduce((sum, c) => sum + c.membersCount, 0)
    const totalMeetings = cellsWithStats.reduce((sum, c) => sum + c.completedMeetingsCount, 0)

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rede-kids">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Minha Supervisao</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {cells.length} {cells.length === 1 ? 'celula' : 'celulas'} sob sua supervisao
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Home className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{cells.length}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Celulas</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Baby className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{totalChildren}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Criancas</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{totalMembers}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Voluntarios</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{totalMeetings}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Reunioes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cells List */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-purple-500/5 border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="w-5 h-5 text-purple-500" />
                        Celulas Supervisionadas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {cellsWithStats.length === 0 ? (
                        <div className="p-12 text-center">
                            <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">
                                Voce ainda nao supervisiona nenhuma celula.
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                A Pastora Kids pode atribuir celulas para voce supervisionar.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {cellsWithStats.map(cell => (
                                <Link
                                    key={cell.id}
                                    href={`/rede-kids/celulas/${cell.id}`}
                                    className="block p-4 hover:bg-muted/50 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <h3 className="font-bold text-foreground">{cell.name}</h3>
                                                <Badge variant={cell.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                                    {cell.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {cell.leader && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {cell.leader.full_name}
                                                    </span>
                                                )}
                                                {cell.day_of_week !== null && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {DAYS_OF_WEEK[cell.day_of_week]}
                                                        {cell.meeting_time && ` ${cell.meeting_time.slice(0, 5)}`}
                                                    </span>
                                                )}
                                                {cell.neighborhood && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {cell.neighborhood}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                                        <Baby className="w-3 h-3 text-amber-500" />
                                                    </div>
                                                    <span className="font-semibold">{cell.childrenCount}</span>
                                                    <span className="text-muted-foreground">criancas</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                        <Users className="w-3 h-3 text-blue-500" />
                                                    </div>
                                                    <span className="font-semibold">{cell.membersCount}</span>
                                                    <span className="text-muted-foreground">membros</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
                                                        <Calendar className="w-3 h-3 text-green-500" />
                                                    </div>
                                                    <span className="font-semibold">{cell.completedMeetingsCount}</span>
                                                    <span className="text-muted-foreground">reunioes</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            {upcomingMeetings.length > 0 && (
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-blue-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Proximas Reunioes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {upcomingMeetings.map(meeting => (
                                <Link
                                    key={meeting.id}
                                    href={`/rede-kids/celulas/${meeting.kids_cell_id}/reunioes/${meeting.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            meeting.status === 'IN_PROGRESS' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                                        }`}>
                                            <Calendar className={`h-5 w-5 ${
                                                meeting.status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-blue-500'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                                {meeting.meeting_time && ` as ${meeting.meeting_time.slice(0, 5)}`}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{meeting.kids_cell?.name}</span>
                                                {meeting.theme && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3" />
                                                            {meeting.theme}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={`text-xs ${
                                        meeting.status === 'IN_PROGRESS'
                                            ? 'bg-amber-500/10 text-amber-600'
                                            : 'bg-blue-500/10 text-blue-600'
                                    }`}>
                                        {meeting.status === 'IN_PROGRESS' ? 'Em andamento' : 'Agendada'}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/rede-kids/criancas">
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-2">
                                <Baby className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="font-semibold">Ver Criancas</p>
                            <p className="text-xs text-muted-foreground">Gerenciar criancas</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/rede-kids/celulas">
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-2">
                                <Home className="w-6 h-6 text-purple-500" />
                            </div>
                            <p className="font-semibold">Todas as Celulas</p>
                            <p className="text-xs text-muted-foreground">Ver rede completa</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
