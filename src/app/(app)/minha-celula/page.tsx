import { getMyCellData } from '@/actions/cell'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StartMeetingButton } from '@/components/buttons/start-meeting-button'
import {
    Users,
    MapPin,
    Clock,
    AlertTriangle,
    ChevronRight,
    CalendarDays
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function MinhaCelulaPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const data = await getMyCellData(profile.id)

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card rounded-3xl shadow-sm border border-border">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-4xl mb-6">
                    ⛪
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Sem Célula Atribuída</h2>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    Você ainda não foi vinculado como líder a uma célula ativa. Entre em contato com seu pastor.
                </p>
            </div>
        )
    }

    const { cell, stats, members, recentMeetings, alerts, activeMeeting } = data

    return (
        <div className="space-y-6 pb-20">
            {/* Célula Info Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-primary text-white">
                <CardContent className="pt-8 pb-6 bg-gradient-to-br from-primary to-primary/80">
                    <h1 className="text-2xl font-extrabold mb-1">{cell.name}</h1>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-primary-foreground/90 mt-4 mb-8">
                        {cell.dayOfWeek !== null && (
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                <Clock className="h-4 w-4" />
                                {DAYS[cell.dayOfWeek]}, {cell.meetingTime?.slice(0, 5)}
                            </span>
                        )}
                        {cell.neighborhood && (
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                <MapPin className="h-4 w-4" />
                                {cell.neighborhood}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center">
                            <p className="text-3xl font-black">{stats.membersCount}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-primary-foreground/80">Membros</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center">
                            <p className="text-3xl font-black">{stats.avgAttendance}%</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-primary-foreground/80">Presença Média</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Primary Action Button */}
            <div className="px-1">
                {activeMeeting ? (
                    <Link href={`/minha-celula/reuniao/${activeMeeting.id}`}>
                        <Button className="w-full h-14 text-base font-bold bg-amber-500 hover:bg-amber-600 shadow-lg text-white">
                            📝 Continuar Relatório em Aberto
                        </Button>
                    </Link>
                ) : (
                    <StartMeetingButton cellId={cell.id} />
                )}
            </div>

            {/* Alertas Críticos */}
            {alerts.length > 0 && (
                <Card className="border border-red-500/30 bg-red-500/10 shadow-sm">
                    <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0">
                        <AlertTriangle className="h-4 w-4 text-red-300" />
                        <CardTitle className="text-sm font-bold text-red-200">
                            Atenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-1">
                        {alerts.map((alert, i) => (
                            <p key={i} className="text-sm text-red-200 font-medium">• {alert.message}</p>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Membros Preview List */}
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Users className="h-5 w-5 text-primary" />
                            Membros
                        </CardTitle>
                        <Link
                            href="/minha-celula/membros"
                            className="text-sm font-semibold text-primary flex items-center gap-0.5 hover:underline"
                        >
                            Ver todos <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhum membro cadastrado.</p>
                    ) : members.map(member => (
                        <div
                            key={member.id}
                            className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border"
                        >
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={member.photoUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-bold text-foreground text-sm">{member.fullName}</p>
                            </div>
                            {member.consecutiveAbsences >= 2 && (
                                <Badge variant="destructive" className="font-bold">
                                    {member.consecutiveAbsences} f
                                </Badge>
                            )}
                        </div>
                    ))}

                    {stats.membersCount > 5 && (
                        <Link
                            href="/minha-celula/membros"
                            className="block text-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                            E outros {stats.membersCount - 5} membros
                        </Link>
                    )}
                </CardContent>
            </Card>

            {/* Histórico Recente */}
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Últimas Reuniões
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    {recentMeetings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground italic">Nenhuma reunião realizada ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentMeetings.map(meeting => (
                                <Link
                                    key={meeting.id}
                                    href={`/minha-celula/reuniao/${meeting.id}`}
                                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                                >
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {format(new Date(meeting.date), "dd 'de' MMMM", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {meeting.presentCount} {meeting.presentCount === 1 ? 'presente' : 'presentes'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {meeting.hasReport ? (
                                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold">✓ Relatório</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-300 border-amber-500/30">Pendente</Badge>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ações Secundárias */}
            <div className="grid grid-cols-2 gap-4 pb-4">
                <Link href="/minha-celula/membros/novo">
                    <Button variant="outline" className="w-full h-12 font-bold border-2 rounded-xl">
                        + Novo Membro
                    </Button>
                </Link>
                <Link href="/cultos">
                    <Button variant="outline" className="w-full h-12 font-bold border-2 rounded-xl">
                        Presença Culto
                    </Button>
                </Link>
            </div>
        </div>
    )
}
