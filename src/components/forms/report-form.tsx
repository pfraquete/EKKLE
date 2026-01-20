'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReport } from '@/actions/reports'
import { ReportInput } from '@/actions/reports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Minus,
    Loader2,
    Check,
    X,
    ChevronLeft,
    Users,
    ClipboardCheck,
    UserPlus,
    BarChart3,
    MessageSquare,
    Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Member {
    id: string
    full_name: string
    photo_url: string | null
}

interface Meeting {
    id: string
    date: string
    cell: {
        id: string
        name: string
    }
}

interface Props {
    meeting: Meeting
    members: Member[]
    churchId: string
}

export function ReportForm({ meeting, members, churchId }: Props) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Checklist
    const [checklist, setChecklist] = useState({
        icebreaker: false,
        worship: false,
        word: false,
        prayer: false,
        snack: false
    })

    // Attendance - default to present
    const [attendance, setAttendance] = useState<Record<string, boolean>>(
        Object.fromEntries(members.map(m => [m.id, true]))
    )

    // Visitors
    const [visitors, setVisitors] = useState<{ name: string; phone: string }[]>([])
    const [newVisitor, setNewVisitor] = useState({ name: '', phone: '' })

    // Numbers (Visitors and Decisions)
    const [visitorsCount, setVisitorsCount] = useState(0)
    const [decisionsCount, setDecisionsCount] = useState(0)

    // Observations
    const [observations, setObservations] = useState('')

    const toggleAttendance = (memberId: string) => {
        setAttendance(prev => ({ ...prev, [memberId]: !prev[memberId] }))
    }

    const addVisitor = () => {
        if (newVisitor.name.trim().length < 2) return
        setVisitors(prev => [...prev, { ...newVisitor }])
        setNewVisitor({ name: '', phone: '' })
        setVisitorsCount(prev => prev + 1)
    }

    const removeVisitor = (index: number) => {
        setVisitors(prev => prev.filter((_, i) => i !== index))
        setVisitorsCount(prev => Math.max(0, prev - 1))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const data: ReportInput = {
                meetingId: meeting.id,
                churchId,
                hasIcebreaker: checklist.icebreaker,
                hasWorship: checklist.worship,
                hasWord: checklist.word,
                hasPrayer: checklist.prayer,
                hasSnack: checklist.snack,
                memberAttendance: Object.entries(attendance).map(([profileId, present]) => ({
                    profileId,
                    present
                })),
                visitorsArray: visitors,
                visitorsCount,
                decisionsCount,
                observations: observations || undefined
            }

            await submitReport(data)
            router.push('/minha-celula?success=report')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao enviar relatório. Verifique sua conexão.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const presentCount = Object.values(attendance).filter(Boolean).length

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-32 bg-zinc-950 min-h-screen p-4 rounded-[2.5rem]">
            {/* Dynamic Floating Header (Mobile Friendly) */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 flex items-center justify-between border-b border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-foreground leading-none">{meeting.cell.name}</h1>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-bold mt-1">
                            {format(new Date(meeting.date), "EEEE, dd/MM", { locale: ptBR })}
                        </p>
                    </div>
                </div>
                <Badge className="bg-primary text-primary-foreground font-bold h-7 px-3">
                    Relatório 60s
                </Badge>
            </div>

            {/* Checklist Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Checklist da Reunião
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">O que aconteceu hoje?</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 gap-1">
                    {[
                        { key: 'icebreaker', label: 'Quebra-gelo' },
                        { key: 'worship', label: 'Louvor' },
                        { key: 'word', label: 'Palavra' },
                        { key: 'prayer', label: 'Oração' },
                        { key: 'snack', label: 'Lanche' }
                    ].map(item => (
                        <label
                            key={item.key}
                            className={`
                flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                ${checklist[item.key as keyof typeof checklist]
                                    ? 'bg-primary/10 border-primary/20'
                                    : 'bg-card border-border hover:bg-muted/50'
                                }
              `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checklist[item.key as keyof typeof checklist] ? 'bg-primary border-primary' : 'bg-card border-muted-foreground/30'}`}>
                                    {checklist[item.key as keyof typeof checklist] && <Check className="h-4 w-4 text-primary-foreground" />}
                                </div>
                                <span className={`text-sm font-semibold ${checklist[item.key as keyof typeof checklist] ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {item.label}
                                </span>
                            </div>
                            <Checkbox
                                checked={checklist[item.key as keyof typeof checklist]}
                                onCheckedChange={(checked) =>
                                    setChecklist(prev => ({ ...prev, [item.key]: !!checked }))
                                }
                                className="sr-only"
                            />
                        </label>
                    ))}
                </CardContent>
            </Card>

            {/* Attendance Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base flex items-center justify-between text-foreground">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Membros Presentes
                        </div>
                        <Badge variant="outline" className="font-bold border-primary text-primary">
                            {presentCount}/{members.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Toque nos membros que faltaram</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    {members.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4 italic">Sem membros castrados na célula.</p>
                    ) : members.map(member => (
                        <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAttendance(member.id)}
                            className={`
                w-full flex items-center gap-4 p-3 rounded-2xl transition-all border
                ${attendance[member.id]
                                    ? 'bg-green-500/10 border-green-500/20 border-l-4 border-l-green-500'
                                    : 'bg-muted border-border border-l-4 border-l-muted-foreground/30 opacity-60'
                                }
              `}
                        >
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={member.photo_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className={`flex-1 text-left text-sm font-bold ${attendance[member.id] ? 'text-foreground' : 'text-muted-foreground italic line-through'}`}>
                                {member.full_name}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${attendance[member.id] ? 'bg-green-500 text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                                {attendance[member.id] ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Visitors Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Visitantes na Reunião
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Cadastre quem visitou sua célula</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Quick Add Form */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border border-dashed">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">NOME DO VISITANTE</Label>
                            <Input
                                placeholder="Ex: Carlos Silva"
                                value={newVisitor.name}
                                onChange={e => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                                className="h-12 rounded-xl bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">WHATSAPP (OPCIONAL)</Label>
                            <Input
                                placeholder="(12) 99999-9999"
                                value={newVisitor.phone}
                                onChange={e => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-12 rounded-xl bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={addVisitor}
                            disabled={newVisitor.name.trim().length < 2}
                            className="w-full h-11 rounded-xl border-primary text-primary font-bold hover:bg-primary/5 hover:text-primary"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar à Lista
                        </Button>
                    </div>

                    {/* List of Visitors */}
                    <div className="space-y-2">
                        {visitors.map((v, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                                        {v.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{v.name}</p>
                                        {v.phone && <p className="text-[10px] font-medium text-blue-400">{v.phone}</p>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeVisitor(i)}
                                    className="text-red-400 h-8 w-8 hover:text-red-600 hover:bg-transparent"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Métricas de Impacto
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Quantifique os frutos de hoje</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                    <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border border-l-4 border-l-blue-400">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-foreground">Visitantes (1ª Vez)</Label>
                            <p className="text-[10px] text-muted-foreground">Pessoas novas na célula</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2"
                                onClick={() => setVisitorsCount(prev => Math.max(0, prev - 1))}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>
                            <span className="w-6 text-center text-xl font-black text-primary">{visitorsCount}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-primary text-primary"
                                onClick={() => setVisitorsCount(prev => prev + 1)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border border-l-4 border-l-amber-400">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-foreground">Decisões por Cristo</Label>
                            <p className="text-[10px] text-muted-foreground">Conversões ou reconciliações</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2"
                                onClick={() => setDecisionsCount(prev => Math.max(0, prev - 1))}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>
                            <span className="w-6 text-center text-xl font-black text-amber-500">{decisionsCount}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-amber-500 text-amber-500"
                                onClick={() => setDecisionsCount(prev => prev + 1)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Observations Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Observações e Pedidos
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Opcional: Compartilhe algo com seu pastor</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <Textarea
                        placeholder="Ex: Precisamos de oração pelo membro tal... A reunião foi muito abençoada!"
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                        rows={4}
                        className="rounded-2xl bg-zinc-950/50 border-zinc-800 italic text-white placeholder:text-zinc-600"
                    />
                </CardContent>
            </Card>

            {/* Floating Action Button for Submission */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                            ENVIANDO...
                        </>
                    ) : (
                        <>
                            <Check className="h-6 w-6 mr-3 stroke-[3px]" />
                            ENVIAR RELATÓRIO
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
