import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsCell } from '@/actions/kids-cells'
import { getKidsMeetingById } from '@/actions/kids-meetings'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Calendar,
    Clock,
    BookOpen,
    BookMarked,
    FileText,
    Baby,
    Users,
    CheckCircle,
    XCircle,
    PlayCircle,
    User
} from 'lucide-react'
import { EditMeetingDialog } from './edit-meeting-dialog'
import { MeetingStatusActions } from './meeting-status-actions'

interface Props {
    params: Promise<{ id: string; meetingId: string }>
}

const STATUS_CONFIG = {
    SCHEDULED: {
        label: 'Agendada',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200',
        icon: Calendar
    },
    IN_PROGRESS: {
        label: 'Em Andamento',
        color: 'bg-amber-500/10 text-amber-600 border-amber-200',
        icon: PlayCircle
    },
    COMPLETED: {
        label: 'Realizada',
        color: 'bg-green-500/10 text-green-600 border-green-200',
        icon: CheckCircle
    },
    CANCELED: {
        label: 'Cancelada',
        color: 'bg-red-500/10 text-red-600 border-red-200',
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
    if (!timeStr) return 'Horario nao definido'
    return timeStr.slice(0, 5)
}

export default async function MeetingDetailPage({ params }: Props) {
    const { id: cellId, meetingId } = await params
    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
        redirect('/dashboard')
    }

    const [cell, meeting] = await Promise.all([
        getKidsCell(cellId),
        getKidsMeetingById(meetingId)
    ])

    if (!cell || !meeting) {
        notFound()
    }

    const isPastor = profile.role === 'PASTOR'
    const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
    const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
    const isLeaderKids = profile.kids_role === 'LEADER_KIDS'
    const canManage = isPastor || isPastoraKids || isDiscipuladoraKids || isLeaderKids

    const statusConfig = STATUS_CONFIG[meeting.status]
    const StatusIcon = statusConfig.icon

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Link href={`/rede-kids/celulas/${cellId}/reunioes`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-foreground">Reuniao</h1>
                            <Badge className={`${statusConfig.color} border`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {cell.name}
                        </p>
                    </div>
                </div>
                {canManage && meeting.status !== 'CANCELED' && (
                    <EditMeetingDialog meeting={meeting} cellId={cellId} />
                )}
            </div>

            {/* Status Actions */}
            {canManage && (meeting.status === 'SCHEDULED' || meeting.status === 'IN_PROGRESS') && (
                <MeetingStatusActions meeting={meeting} cellId={cellId} />
            )}

            {/* Main Info */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Data e Horario */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-primary" />
                            Data e Horario
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Data</p>
                                <p className="font-semibold capitalize">{formatDate(meeting.meeting_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Horario</p>
                                <p className="font-semibold">{formatTime(meeting.meeting_time)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Presenca */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-amber-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-amber-500" />
                            Presenca
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                                <Baby className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-3xl font-black text-foreground">{meeting.kids_present}</p>
                                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Criancas</p>
                            </div>
                            <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-3xl font-black text-foreground">{meeting.volunteers_present}</p>
                                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Voluntarios</p>
                            </div>
                        </div>
                        {meeting.status !== 'CANCELED' && (
                            <Link href={`/rede-kids/celulas/${cellId}/reunioes/${meetingId}/presenca`}>
                                <Button
                                    variant={meeting.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                                    className={`w-full mt-4 rounded-xl ${meeting.status === 'IN_PROGRESS' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                                >
                                    {meeting.status === 'IN_PROGRESS'
                                        ? 'Registrar Presenca'
                                        : meeting.status === 'COMPLETED'
                                            ? 'Ver Lista de Presenca'
                                            : 'Ver Presenca'}
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Conteudo */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-green-500/5 border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        Conteudo da Reuniao
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Tema</p>
                        <p className="font-medium text-foreground">
                            {meeting.theme || 'Nenhum tema definido'}
                        </p>
                    </div>
                    {meeting.bible_verse && (
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                                <BookMarked className="w-3 h-3" />
                                Versiculo
                            </p>
                            <p className="font-medium text-foreground">{meeting.bible_verse}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notas */}
            {meeting.notes && (
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-purple-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="w-5 h-5 text-purple-500" />
                            Observacoes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-foreground whitespace-pre-wrap">{meeting.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Metadados */}
            <Card className="border-none shadow-sm rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {meeting.creator && (
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Criado por {meeting.creator.full_name}
                            </div>
                        )}
                        {meeting.completed_at && (
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Finalizado em {new Date(meeting.completed_at).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
