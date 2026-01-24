import { getMemberCellData } from '@/actions/cell'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
    Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { getCellPhotos } from '@/actions/cell-album'
import { CellPhotoGallery } from '@/components/cell-album/cell-photo-gallery'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function MembroMinhaCelulaPage() {
    const data = await getMemberCellData()

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-card border border-border/50 rounded-[3rem] shadow-2xl">
                <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-5xl mb-8 animate-pulse">
                    ⛪
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4 tracking-tighter italic uppercase">Sem Célula Ativa</h2>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
                    Você ainda não está vinculado a uma célula ativa. <br />Explore as opções disponíveis e solicite sua entrada!
                </p>
                <Link
                    href="/membro/celulas"
                    className="mt-10 bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                    Encontrar uma Célula
                </Link>
            </div>
        )
    }

    const { cell, stats, members, recentMeetings } = data
    // Handle leader object which might be an array or single object from Supabase join
    const leader = Array.isArray(cell.leader) ? cell.leader[0] : cell.leader

    const { data: photos } = await getCellPhotos(cell.id)

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            {/* Premium Header Architecture */}
            <div className="relative group overflow-hidden rounded-[3rem] bg-zinc-950 p-1 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 opacity-50" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -mr-40 -mt-40 rounded-full" />

                <Card className="relative border-none bg-zinc-900/50 backdrop-blur-3xl text-white rounded-[2.8rem]">
                    <CardContent className="p-12">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full uppercase">
                                        Minha Família Ekkle
                                    </Badge>
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter italic uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    {cell.name}
                                </h1>
                                {leader && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                                            <AvatarImage src={leader.photo_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                                                {leader.full_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Liderança</p>
                                            <p className="text-sm font-bold">{leader.full_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:block p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-12">
                            {cell.dayOfWeek !== null && (
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-black uppercase tracking-widest">
                                        {DAYS[cell.dayOfWeek]} • {cell.meetingTime?.slice(0, 5)}
                                    </span>
                                </div>
                            )}
                            {(cell.neighborhood || cell.address) && (
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-black uppercase tracking-widest">
                                        {cell.neighborhood || 'Endereço Disponível'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[2.5rem] p-10 transition-all hover:border-primary/50 group/card">
                                <p className="text-6xl font-black mb-2 tracking-tighter italic group-hover/card:scale-105 transition-transform origin-left">{stats.membersCount}</p>
                                <div className="flex items-center gap-2 opacity-60">
                                    <Users className="h-4 w-4 text-primary" />
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-black">Membros na Célula</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[2.5rem] p-10 transition-all hover:border-primary/50 group/card">
                                <p className="text-6xl font-black mb-2 tracking-tighter italic group-hover/card:scale-105 transition-transform origin-left">{stats.avgAttendance}%</p>
                                <div className="flex items-center gap-2 opacity-60">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-black">Presença Regular</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Members Section */}
                <Card className="border-border/40 shadow-2xl rounded-[3rem] bg-card overflow-hidden">
                    <div className="p-10 pb-6 border-b border-border/40">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-2xl">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">Comunidade</h3>
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Pessoas que caminham com você</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-10 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-5 p-5 rounded-[2rem] bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors group"
                                >
                                    <Avatar className="h-14 w-14 border-2 border-border group-hover:border-primary/40 transition-colors">
                                        <AvatarImage src={member.photoUrl || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                                            {member.fullName[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-black text-foreground text-lg tracking-tight italic uppercase">{member.fullName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Membro Ativo</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                        <CheckCircle2 className="h-5 w-5 text-primary opacity-40" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Meetings Section */}
                <Card className="border-border/40 shadow-2xl rounded-[3rem] bg-card overflow-hidden">
                    <div className="p-10 pb-6 border-b border-border/40">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-2xl">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">Histórico</h3>
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Nossos últimos encontros</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-10">
                        {recentMeetings.length === 0 ? (
                            <div className="text-center py-16 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/60">
                                <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.2em] italic">Nenhuma reunião registrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentMeetings.map(meeting => (
                                    <div
                                        key={meeting.id}
                                        className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/30 border border-border/40"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-background border border-border flex flex-col items-center justify-center shrink-0 shadow-lg">
                                                <span className="text-[10px] font-black uppercase text-primary leading-none mb-1">
                                                    {format(new Date(meeting.date), "MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-xl font-black text-foreground leading-none">
                                                    {format(new Date(meeting.date), "dd")}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-lg text-foreground tracking-tighter italic uppercase">
                                                    Encontro de Célula
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                                                    {meeting.presentCount} pessoas presentes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CellPhotoGallery photos={photos || []} />
        </div>
    )
}
