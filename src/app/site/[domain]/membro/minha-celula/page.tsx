import { Suspense } from 'react'
import { getMemberCellData } from '@/actions/cell'
import { getMemberCellDataOptimized } from '@/actions/cell-optimized'
import { getProfile } from '@/actions/auth'
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
import { CreateInviteLinkDialog } from '@/components/cell-invites/create-invite-link-dialog'
import { AsyncPrayerWall, AsyncPhotoGallery } from '@/components/cell/async-cell-sections'
import { CellBirthdays } from '@/components/cell-prayer/cell-birthdays'
import { 
    PrayerWallSkeleton, 
    BirthdaysSkeleton, 
    PhotoGallerySkeleton 
} from '@/components/cell/cell-loading-skeletons'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function MembroMinhaCelulaPage() {
    // Fetch profile and cell data in parallel
    const [profile, optimizedData] = await Promise.all([
        getProfile(),
        getMemberCellDataOptimized()
    ])
    
    // Fallback to regular query if optimized fails
    const data = optimizedData || await getMemberCellData()
    const isLeader = profile?.role === 'LEADER' || profile?.role === 'PASTOR'

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 sm:p-12 bg-card border border-border/50 rounded-2xl sm:rounded-[3rem] shadow-xl sm:shadow-2xl">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl mb-6 sm:mb-8 animate-pulse">
                    ⛪
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-foreground mb-3 sm:mb-4 tracking-tighter italic uppercase">Sem Célula Ativa</h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
                    Você ainda não está vinculado a uma célula ativa. <br className="hidden sm:block" />Explore as opções disponíveis e solicite sua entrada!
                </p>
                <Link
                    href="/membro/celulas"
                    className="mt-6 sm:mt-10 bg-primary text-primary-foreground px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                    Encontrar uma Célula
                </Link>
            </div>
        )
    }

    const { cell, stats, members, recentMeetings } = data
    // Handle leader object which might be an array or single object from Supabase join
    const leader = Array.isArray(cell.leader) ? cell.leader[0] : cell.leader

    // Prepare members data for birthdays component
    const membersForBirthdays = members.map(m => ({
        id: m.id,
        full_name: m.fullName,
        photo_url: m.photoUrl,
        birth_date: m.birthDate || null
    }))

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12 pb-8 animate-in fade-in duration-700">
            {/* Premium Header Architecture - Loads immediately */}
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-zinc-950 p-0.5 sm:p-1 shadow-xl sm:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 opacity-50" />
                <div className="absolute top-0 right-0 w-40 sm:w-80 h-40 sm:h-80 bg-primary/20 blur-[60px] sm:blur-[120px] -mr-20 sm:-mr-40 -mt-20 sm:-mt-40 rounded-full" />

                <Card className="relative border-none bg-zinc-900/50 backdrop-blur-3xl text-white rounded-2xl sm:rounded-[1.8rem] lg:rounded-[2.8rem]">
                    <CardContent className="p-5 sm:p-8 lg:p-12">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-8 mb-6 sm:mb-8 lg:mb-12">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-xs sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase">
                                        Minha Família Ekkle
                                    </Badge>
                                </div>
                                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    {cell.name}
                                </h1>
                                {leader && (
                                    <div className="flex items-center gap-3 pt-1 sm:pt-2">
                                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/20">
                                            <AvatarImage src={leader.photo_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                                                {leader.full_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xs sm:text-xs font-black uppercase tracking-widest text-primary/80">Liderança</p>
                                            <p className="text-xs sm:text-sm font-bold">{leader.full_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="hidden lg:block p-4 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
                                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 lg:mb-12">
                            {cell.dayOfWeek !== null && (
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest">
                                        {DAYS[cell.dayOfWeek]} • {cell.meetingTime?.slice(0, 5)}
                                    </span>
                                </div>
                            )}
                            {(cell.neighborhood || cell.address) && (
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest">
                                        {cell.neighborhood || 'Endereço Disponível'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-6">
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 transition-all hover:border-primary/50 group/card">
                                <p className="text-3xl sm:text-5xl lg:text-6xl font-black mb-1 sm:mb-2 tracking-tighter italic group-hover/card:scale-105 transition-transform origin-left">{stats.membersCount}</p>
                                <div className="flex items-center gap-1.5 sm:gap-2 opacity-60">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                    <p className="text-xs sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-black">Membros</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 transition-all hover:border-primary/50 group/card">
                                <p className="text-3xl sm:text-5xl lg:text-6xl font-black mb-1 sm:mb-2 tracking-tighter italic group-hover/card:scale-105 transition-transform origin-left">{stats.avgAttendance}%</p>
                                <div className="flex items-center gap-1.5 sm:gap-2 opacity-60">
                                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                    <p className="text-xs sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-black">Presença</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Members and Meetings - Load immediately (critical content) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                {/* Members Section */}
                <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
                    <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 lg:p-4 bg-primary/10 rounded-xl sm:rounded-2xl">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter italic uppercase">Comunidade</h3>
                                <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest">Pessoas que caminham com você</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-4 sm:p-6 lg:p-10 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 sm:gap-5 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-[2rem] bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors group"
                                >
                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 border-2 border-border group-hover:border-primary/40 transition-colors">
                                        <AvatarImage src={member.photoUrl || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary font-black text-sm sm:text-lg">
                                            {member.fullName[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-foreground text-sm sm:text-base lg:text-lg tracking-tight italic uppercase truncate">{member.fullName}</p>
                                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                                            <p className="text-xs sm:text-xs uppercase font-black text-muted-foreground tracking-wider sm:tracking-[0.2em]">Membro Ativo</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 flex-shrink-0">
                                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary opacity-40" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Meetings Section - Only visible for leaders */}
                {isLeader && (
                <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
                    <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2.5 sm:p-3 lg:p-4 bg-primary/10 rounded-xl sm:rounded-2xl">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter italic uppercase">Histórico</h3>
                                    <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest">Seus últimos encontros</p>
                                </div>
                            </div>
                            <Link href="/membro/minha-celula/reunioes" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                                Ver Tudo
                            </Link>
                        </div>
                    </div>
                    <CardContent className="p-4 sm:p-6 lg:p-10">
                        {recentMeetings.length === 0 ? (
                            <div className="text-center py-8 sm:py-12 lg:py-16 bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-dashed border-border/60">
                                <p className="text-xs sm:text-sm text-muted-foreground font-black uppercase tracking-wider sm:tracking-[0.2em] italic">Nenhuma reunião registrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {recentMeetings.map(meeting => (
                                    <Link
                                        key={meeting.id}
                                        href={`/membro/minha-celula/reunioes/${meeting.id}`}
                                        className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl bg-background border border-border flex flex-col items-center justify-center shrink-0 shadow-md sm:shadow-lg">
                                                <span className="text-xs sm:text-xs lg:text-xs font-black uppercase text-primary leading-none mb-0.5 sm:mb-1">
                                                    {format(new Date(meeting.date), "MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-base sm:text-lg lg:text-xl font-black text-foreground leading-none">
                                                    {format(new Date(meeting.date), "dd")}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm sm:text-base lg:text-lg text-foreground tracking-tighter italic uppercase truncate">
                                                    Encontro de Célula
                                                </p>
                                                <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest mt-0.5 sm:mt-1">
                                                    {meeting.presentCount} pessoas presentes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-500/20 flex-shrink-0">
                                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                )}
            </div>

            {/* Leader Actions - Load immediately if leader */}
            {isLeader && (
                <div className="bg-card border border-border/40 rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] p-4 sm:p-6 lg:p-10 shadow-xl sm:shadow-2xl">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                        <div className="p-2.5 sm:p-3 lg:p-4 bg-primary/10 rounded-xl sm:rounded-2xl">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter italic uppercase">Área do Líder</h3>
                            <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest">Gerencie sua célula</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <CreateInviteLinkDialog cellId={cell.id} churchSlug={profile?.church_id || ''} />
                    </div>
                </div>
            )}

            {/* Prayer Wall and Birthdays - Stream with Suspense */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <Suspense fallback={<PrayerWallSkeleton />}>
                    <AsyncPrayerWall 
                        cellId={cell.id} 
                        currentUserId={profile?.id || ''}
                    />
                </Suspense>
                
                {/* Birthdays doesn't need async loading, render directly */}
                <CellBirthdays members={membersForBirthdays} />
            </div>

            {/* Photo Gallery - Stream with Suspense (heaviest content) */}
            <Suspense fallback={<PhotoGallerySkeleton />}>
                <AsyncPhotoGallery cellId={cell.id} />
            </Suspense>
        </div>
    )
}
