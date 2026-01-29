import { getMyCellData } from '@/actions/cell'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    MapPin,
    Clock,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    Calendar,
    Plus,
    Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { getCellPhotos } from '@/actions/cell-album'
import { CellAlbumManager } from '@/components/cell-album/cell-album-manager'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function MinhaCelulaPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const data = await getMyCellData()
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-card rounded-[2.5rem] shadow-2xl border border-border/50">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl mb-8 animate-pulse">
                    ⛪
                </div>
                <h2 className="text-2xl font-black text-foreground mb-3">Sem Célula Vinculada</h2>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
                    Você ainda não foi vinculado como líder. <br />Entre em contato com a administração para regularizar seu acesso.
                </p>
                <Button variant="outline" className="mt-8 rounded-2xl font-bold h-12 px-8" asChild>
                    <Link href="/dashboard">Voltar ao Dashboard</Link>
                </Button>
            </div>
        )
    }

    const { cell, stats, members, recentMeetings } = data
    const { data: photos } = await getCellPhotos(cell.id)

    return (
        <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header Architecture */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-zinc-950 p-1 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 opacity-50" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <Card className="relative border-none bg-zinc-900/50 backdrop-blur-xl text-white rounded-[2.2rem]">
                    <CardContent className="p-5 sm:p-8">
                        <div className="flex items-start justify-between mb-6 sm:mb-8">
                            <div className="space-y-2">
                                <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[10px] tracking-[0.2em] px-3 py-1 rounded-full uppercase">
                                    Minha Célula
                                </Badge>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    {cell.name}
                                </h1>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
                            {cell.dayOfWeek !== null && (
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-sm">
                                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                    <span className="text-xs sm:text-sm font-bold tracking-tight">
                                        {DAYS[cell.dayOfWeek]} • {cell.meetingTime?.slice(0, 5)}
                                    </span>
                                </div>
                            )}
                            {cell.neighborhood && (
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-sm">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                    <span className="text-xs sm:text-sm font-bold tracking-tight truncate max-w-[150px] sm:max-w-none">{cell.neighborhood}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all hover:border-primary/50 group/card">
                                <p className="text-2xl sm:text-4xl font-black mb-1 group-hover/card:scale-110 transition-transform origin-left">{stats.membersCount}</p>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Users className="h-3 w-3" />
                                    <p className="text-[10px] uppercase tracking-widest font-black">Membros</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all hover:border-primary/50 group/card">
                                <p className="text-2xl sm:text-4xl font-black mb-1 group-hover/card:scale-110 transition-transform origin-left">{stats.avgAttendance}%</p>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Activity className="h-3 w-3" />
                                    <p className="text-[10px] uppercase tracking-widest font-black">Presença Média</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Reuniões Section */}
                <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-card overflow-hidden">
                    <CardHeader className="p-4 sm:p-8 pb-2 sm:pb-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                                    Reuniões
                                </CardTitle>
                            </div>
                            <Link
                                href="/minha-celula/reunioes"
                                className="h-9 sm:h-10 px-3 sm:px-4 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black text-primary hover:bg-primary/5 rounded-full border border-primary/10 transition-colors uppercase tracking-wider sm:tracking-widest"
                            >
                                <span className="hidden sm:inline">Ver todas</span>
                                <span className="sm:hidden">Todas</span>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-8 pt-0">
                        {recentMeetings.length === 0 ? (
                            <div className="text-center py-10 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                                <p className="text-sm text-muted-foreground font-bold italic">Nenhuma reunião lançada.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-4">
                                {recentMeetings.slice(0, 3).map(meeting => (
                                    <Link
                                        key={meeting.id}
                                        href={`/minha-celula/reunioes/${meeting.id}`}
                                        className="relative flex items-center justify-between p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group min-h-[72px]"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-6">
                                            <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background border border-border flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground leading-none mb-0.5">
                                                    {format(new Date(meeting.date), "MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-base sm:text-lg font-black text-foreground leading-none">
                                                    {format(new Date(meeting.date), "dd")}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-base sm:text-lg text-foreground tracking-tight">
                                                    Reunião
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider sm:tracking-widest">
                                                    {meeting.presentCount} presentes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all">
                                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Members Section */}
                <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-card overflow-hidden">
                    <CardHeader className="p-4 sm:p-8 pb-2 sm:pb-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                                    Membros
                                </CardTitle>
                            </div>
                            <Link
                                href="/minha-celula/membros"
                                className="h-9 sm:h-10 px-3 sm:px-4 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black text-primary hover:bg-primary/5 rounded-full border border-primary/10 transition-colors uppercase tracking-wider sm:tracking-widest"
                            >
                                <span className="hidden sm:inline">Ver todos</span>
                                <span className="sm:hidden">Todos</span>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-8 pt-0 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {members.slice(0, 5).map(member => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-muted/40 border border-border/50"
                                >
                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                        <AvatarImage src={member.photoUrl || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary font-black text-sm sm:text-base">
                                            {member.fullName[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-foreground text-sm sm:text-base tracking-tight truncate">{member.fullName}</p>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Membro</p>
                                    </div>
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Footer Bar */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-12">
                <Link href="/minha-celula/membros/novo" className="group">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 w-full h-14 sm:h-16 font-black border-2 border-border/50 rounded-xl sm:rounded-[1.5rem] bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-125 transition-transform" />
                        Membro
                    </div>
                </Link>
                <Link href="/minha-celula/reunioes/nova" className="group">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 w-full h-14 sm:h-16 font-black border-2 border-border/50 rounded-xl sm:rounded-[1.5rem] bg-primary/10 hover:bg-primary/20 hover:border-primary/30 transition-all text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest text-primary">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-125 transition-transform" />
                        Reunião
                    </div>
                </Link>
                <div className="col-span-2">
                    <Link href="/minha-celula/solicitacoes" className="group">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full h-12 sm:h-14 font-bold border border-border/50 rounded-xl sm:rounded-[1.5rem] bg-zinc-900/50 hover:bg-zinc-800 transition-all text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-400 hover:text-white">
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Ver Solicitações Pendentes</span>
                            <span className="sm:hidden">Solicitações</span>
                        </div>
                    </Link>
                </div>
            </div>

            <CellAlbumManager
                cellId={cell.id}
                churchId={profile.church_id}
                initialPhotos={photos || []}
            />
        </div>
    )
}
