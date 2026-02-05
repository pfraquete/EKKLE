import { getMemberCellData } from '@/actions/cell'
import { getMemberCellDataOptimized } from '@/actions/cell-optimized'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Calendar, Plus, ChevronLeft, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default async function ReunioesPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // Only leaders and pastors can access this page
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const optimizedData = await getMemberCellDataOptimized()
    const data = optimizedData || await getMemberCellData()
    if (!data) redirect('/membro/minha-celula')

    const { recentMeetings } = data

    return (
        <div className="space-y-4 sm:space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Button variant="ghost" size="icon" asChild className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                        <Link href="/membro/minha-celula">
                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Link>
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">Reuniões</h1>
                </div>
                <Button size="sm" className="rounded-full font-black text-xs sm:text-xs uppercase tracking-wider sm:tracking-widest px-3 sm:px-4 h-8 sm:h-9" asChild>
                    <Link href="/membro/minha-celula/reunioes/nova">
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Nova </span>Reunião
                    </Link>
                </Button>
            </div>

            {/* Meetings List */}
            <div className="space-y-3 sm:space-y-4">
                {recentMeetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center bg-card rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-muted">
                        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mb-3 sm:mb-4" />
                        <p className="text-xs sm:text-sm text-muted-foreground font-bold italic">Nenhuma reunião registrada.</p>
                        <Button variant="link" className="text-primary font-black mt-2 text-sm" asChild>
                            <Link href="/membro/minha-celula/reunioes/nova">Registrar primeira reunião</Link>
                        </Button>
                    </div>
                ) : (
                    recentMeetings.map(meeting => (
                        <Link
                            key={meeting.id}
                            href={`/membro/minha-celula/reunioes/${meeting.id}`}
                            className="block"
                        >
                            <Card className="border-none shadow-lg sm:shadow-xl rounded-xl sm:rounded-[2rem] bg-card hover:bg-muted/30 transition-all group">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                            <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-xs sm:text-xs font-black uppercase text-primary leading-none mb-0.5 sm:mb-1">
                                                    {format(new Date(meeting.date), "MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-base sm:text-xl font-black text-primary leading-none">
                                                    {format(new Date(meeting.date), "dd")}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-sm sm:text-lg text-foreground tracking-tight truncate">Reunião de Célula</h3>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <div className="flex items-center gap-1 text-xs sm:text-xs font-bold text-muted-foreground uppercase tracking-wider sm:tracking-widest">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="hidden xs:inline">{format(new Date(meeting.date), "EEEE", { locale: ptBR })}</span>
                                                        <span className="xs:hidden">{format(new Date(meeting.date), "EEE", { locale: ptBR })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs sm:text-xs font-bold text-emerald-500 uppercase tracking-wider sm:tracking-widest">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {meeting.presentCount} presentes
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Quick Tips */}
            <Card className="border-none bg-primary/5 rounded-xl sm:rounded-[2rem] p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-black text-primary text-xs sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Dica de Líder</h4>
                        <p className="text-xs sm:text-xs text-muted-foreground font-semibold leading-relaxed">
                            Mantenha o histórico atualizado para que o seu pastor possa acompanhar o crescimento da sua célula em tempo real.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
