import { getCellDetails } from '@/actions/cell'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ChevronLeft, Clock, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface CellDetailsPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CellDetailsPage({ params }: CellDetailsPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const data = await getCellDetails(id)
    if (!data) redirect('/celulas')

    const isAuthorized = profile.role === 'PASTOR'
        || (profile.role === 'LEADER' && data.cell.leader?.id === profile.id)

    if (!isAuthorized) redirect('/dashboard')

    const { cell, stats, members, recentMeetings } = data
    const statusLabel = cell.status === 'ACTIVE' ? 'Ativa' : 'Inativa'
    const backHref = profile.role === 'PASTOR' ? '/celulas' : '/minha-celula'

    return (
        <div className="space-y-6 pb-20">
            <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
            >
                <ChevronLeft className="h-4 w-4" />
                Voltar
            </Link>

            <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-foreground">{cell.name}</h1>
                            <p className="text-sm text-muted-foreground font-medium">Resumo da célula</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {profile.role === 'PASTOR' && (
                                <Link href={`/celulas/${cell.id}/editar`}>
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold">
                                        Editar
                                    </Button>
                                </Link>
                            )}
                            <Badge variant={cell.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {statusLabel}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                        {cell.dayOfWeek !== null && (
                            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-muted px-2.5 sm:px-3 py-1">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">{DAYS[cell.dayOfWeek]} {cell.meetingTime ? `• ${cell.meetingTime.slice(0, 5)}` : ''}</span>
                            </span>
                        )}
                        {cell.neighborhood && (
                            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-muted px-2.5 sm:px-3 py-1">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate max-w-[150px] sm:max-w-none">{cell.neighborhood}</span>
                            </span>
                        )}
                        {cell.address && (
                            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-muted px-2.5 sm:px-3 py-1">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate max-w-[150px] sm:max-w-none">{cell.address}</span>
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={cell.leader?.photoUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {(cell.leader?.fullName || 'S L')
                                            .split(' ')
                                            .map(name => name[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Líder</p>
                                    <p className="font-bold text-foreground">
                                        {cell.leader?.fullName || 'Sem líder'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                            <p className="text-3xl font-black text-foreground">{stats.membersCount}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Membros</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                            <p className="text-3xl font-black text-foreground">{stats.avgAttendance}%</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Frequência média</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Users className="h-5 w-5 text-primary" />
                            Membros
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6 italic">
                                Nenhum membro cadastrado nesta célula.
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                                {members.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3"
                                    >
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={member.photoUrl || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {member.fullName
                                                    .split(' ')
                                                    .map(name => name[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold text-foreground text-sm">{member.fullName}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Últimas Reuniões
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                        {recentMeetings.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6 italic">
                                Nenhuma reunião registrada.
                            </p>
                        ) : (
                            recentMeetings.map(meeting => (
                                <div
                                    key={meeting.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                                >
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {format(new Date(meeting.date), "dd 'de' MMMM", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {meeting.presentCount} {meeting.presentCount === 1 ? 'presente' : 'presentes'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={meeting.hasReport ? 'secondary' : 'outline'}
                                        className={meeting.hasReport
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                                            : 'text-amber-300 border-amber-500/30'}
                                    >
                                        {meeting.hasReport ? 'Relatório enviado' : 'Relatório pendente'}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
