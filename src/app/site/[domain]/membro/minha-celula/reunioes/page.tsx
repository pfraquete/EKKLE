import { getMemberCellData } from '@/actions/cell'
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

    // Only leaders can access this page
    if (profile.role !== 'LEADER') {
        redirect('/membro/minha-celula')
    }

    const data = await getMemberCellData()
    if (!data) redirect('/membro/minha-celula')

    const { recentMeetings } = data

    return (
        <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/membro/minha-celula">
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-black text-foreground">Reuniões</h1>
                </div>
                <Button size="sm" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4" asChild>
                    <Link href="/membro/minha-celula/reunioes/nova">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Reunião
                    </Link>
                </Button>
            </div>

            {/* Meetings List */}
            <div className="space-y-4">
                {recentMeetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-muted">
                        <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground font-bold italic">Nenhuma reunião registrada.</p>
                        <Button variant="link" className="text-primary font-black mt-2" asChild>
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
                            <Card className="border-none shadow-xl rounded-[2rem] bg-card hover:bg-muted/30 transition-all group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black uppercase text-primary leading-none mb-1">
                                                    {format(new Date(meeting.date), "MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-xl font-black text-primary leading-none">
                                                    {format(new Date(meeting.date), "dd")}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-foreground tracking-tight">Reunião de Célula</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(meeting.date), "EEEE", { locale: ptBR })}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {meeting.presentCount} presentes
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Quick Tips */}
            <Card className="border-none bg-primary/5 rounded-[2rem] p-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-black text-primary text-sm uppercase tracking-wider mb-1">Dica de Líder</h4>
                        <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                            Mantenha o histórico atualizado para que o seu pastor possa acompanhar o crescimento da sua célula em tempo real.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
