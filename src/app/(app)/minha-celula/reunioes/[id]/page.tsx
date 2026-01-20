import { getMeetingData } from '@/actions/meetings'
import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Users, UserPlus, FileText, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default async function MeetingSummaryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const meeting = await getMeetingData(id)
    if (!meeting) notFound()

    const presentMembers = meeting.attendance.filter((a: { profile_id?: string, status: string }) => a.profile_id && a.status === 'PRESENT')
    const visitors = meeting.attendance.filter((a: { visitor_name?: string }) => a.visitor_name)

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-32 p-4 bg-zinc-950 min-h-screen rounded-[2.5rem]">
            {/* Header */}
            <div className="flex items-center gap-3 py-2">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/minha-celula/reunioes">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-black text-white">Resumo da Reunião</h1>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">
                        {format(new Date(meeting.date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none bg-zinc-900 rounded-[2rem] p-6 text-center">
                    <p className="text-3xl font-black text-white mb-1">{presentMembers.length}</p>
                    <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Presentes</p>
                </Card>
                <Card className="border-none bg-zinc-900 rounded-[2rem] p-6 text-center">
                    <p className="text-3xl font-black text-primary mb-1">{visitors.length}</p>
                    <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Visitantes</p>
                </Card>
            </div>

            {/* Attendance List */}
            <Card className="border-none bg-zinc-900 rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Presença
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {presentMembers.length === 0 ? (
                        <p className="text-center text-sm text-zinc-600 italic">Nenhum membro registrado.</p>
                    ) : presentMembers.map((att: { id: string, profile_id: string }) => (
                        <div key={att.id} className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-white">
                                {meeting.cell.members.find((m: { id: string, full_name: string }) => m.id === att.profile_id)?.full_name || 'Membro'}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Visitors List */}
            {visitors.length > 0 && (
                <Card className="border-none bg-zinc-900 rounded-[2rem] overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-primary" />
                            Visitantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {visitors.map((v: { id: string, visitor_name: string, visitor_phone?: string }) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <span className="text-sm font-bold text-white">{v.visitor_name}</span>
                                {v.visitor_phone && <span className="text-[10px] font-black text-blue-400">{v.visitor_phone}</span>}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Observations */}
            {meeting.report?.[0]?.observations && (
                <Card className="border-none bg-zinc-900 rounded-[2rem] overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Observações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-sm text-zinc-400 leading-relaxed italic">
                            &quot;{meeting.report[0].observations}&quot;
                        </p>
                    </CardContent>
                </Card>
            )}

            <Button variant="outline" asChild className="w-full h-14 rounded-2xl border-zinc-800 text-zinc-500 font-bold">
                <Link href="/minha-celula/reunioes">Voltar para o histórico</Link>
            </Button>
        </div>
    )
}
