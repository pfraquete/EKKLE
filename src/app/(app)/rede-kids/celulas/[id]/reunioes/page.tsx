import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsCell } from '@/actions/kids-cells'
import { getKidsMeetingsByCell, getKidsMeetingsStats } from '@/actions/kids-meetings'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Plus,
    Calendar,
    Clock,
    Users,
    Baby,
    CheckCircle,
    XCircle,
    PlayCircle,
    ChevronRight,
    BookOpen
} from 'lucide-react'

interface Props {
    params: Promise<{ id: string }>
}

const STATUS_CONFIG = {
    SCHEDULED: {
        label: 'Agendada',
        color: 'bg-blue-500/10 text-blue-600',
        icon: Calendar
    },
    IN_PROGRESS: {
        label: 'Em Andamento',
        color: 'bg-amber-500/10 text-amber-600',
        icon: PlayCircle
    },
    COMPLETED: {
        label: 'Realizada',
        color: 'bg-green-500/10 text-green-600',
        icon: CheckCircle
    },
    CANCELED: {
        label: 'Cancelada',
        color: 'bg-red-500/10 text-red-600',
        icon: XCircle
    }
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

function formatTime(timeStr: string | null): string {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

export default async function ReunioesKidsCellPage({ params }: Props) {
    const { id: cellId } = await params
    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
        redirect('/dashboard')
    }

    const cell = await getKidsCell(cellId)

    if (!cell) {
        notFound()
    }

    const [meetings, stats] = await Promise.all([
        getKidsMeetingsByCell(cellId),
        getKidsMeetingsStats(cellId)
    ])

    const isPastor = profile.role === 'PASTOR'
    const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
    const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
    const isLeaderKids = profile.kids_role === 'LEADER_KIDS'
    const canManage = isPastor || isPastoraKids || isDiscipuladoraKids || isLeaderKids

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/rede-kids/celulas/${cellId}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Reunioes</h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            {cell.name}
                        </p>
                    </div>
                </div>
                {canManage && (
                    <Link href={`/rede-kids/celulas/${cellId}/reunioes/nova`}>
                        <Button className="rounded-xl font-bold shadow-lg">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Reuniao
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.total}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.completed}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Realizadas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.upcoming}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Agendadas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Baby className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.avgKidsPresent}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Media Criancas</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Meetings List */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Historico de Reunioes ({meetings.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {meetings.length === 0 ? (
                        <div className="p-20 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">
                                Nenhuma reuniao agendada ainda.
                            </p>
                            {canManage && (
                                <Link href={`/rede-kids/celulas/${cellId}/reunioes/nova`}>
                                    <Button className="mt-4 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agendar Primeira Reuniao
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {meetings.map(meeting => {
                                const statusConfig = STATUS_CONFIG[meeting.status]
                                const StatusIcon = statusConfig.icon

                                return (
                                    <Link
                                        key={meeting.id}
                                        href={`/rede-kids/celulas/${cellId}/reunioes/${meeting.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.color}`}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-foreground">
                                                        {formatDate(meeting.meeting_date)}
                                                    </h4>
                                                    <Badge variant="secondary" className={`text-xs ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-0.5">
                                                    {meeting.meeting_time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(meeting.meeting_time)}
                                                        </span>
                                                    )}
                                                    {meeting.theme && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <BookOpen className="h-3 w-3" />
                                                            {meeting.theme}
                                                        </span>
                                                    )}
                                                    {meeting.status === 'COMPLETED' && (
                                                        <span className="flex items-center gap-1">
                                                            <Baby className="h-3 w-3" />
                                                            {meeting.kids_present} criancas
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
