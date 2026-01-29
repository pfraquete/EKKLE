'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFullMeetingReport } from '@/actions/meetings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    UserPlus,
    BarChart3,
    MessageSquare,
    Trash2,
    Calendar as CalendarIcon
} from 'lucide-react'


interface Member {
    id: string
    fullName: string
    photoUrl: string | null
}

interface Props {
    members: Member[]
    cellId: string
    redirectPath?: string
}

export function AttendanceForm({ members, cellId, redirectPath = '/minha-celula/reunioes' }: Props) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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

    // Numbers
    const [visitorsCount, setVisitorsCount] = useState(0)
    const [decisionsCount, setDecisionsCount] = useState(0)
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
            const payload = {
                cellId,
                date,
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

            await createFullMeetingReport(payload)
            router.push(`${redirectPath}?success=true`)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar reunião.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const presentCount = Object.values(attendance).filter(Boolean).length

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-32 bg-zinc-950 min-h-screen p-4 rounded-[2.5rem]">
            {/* Header */}
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-black text-white">Nova Reunião</h1>
                </div>
            </div>

            {/* Date Selection */}
            <Card className="border-none bg-zinc-900 shadow-2xl rounded-[2rem] overflow-hidden">
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Data da Reunião</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="pl-10 h-12 bg-zinc-950 border-zinc-800 rounded-xl text-white appearance-none"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Presença
                        </div>
                        <Badge variant="outline" className="font-bold border-primary text-primary">
                            {presentCount}/{members.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription className="text-zinc-500">Selecione quem esteve presente</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    {members.length === 0 ? (
                        <p className="text-center text-sm text-zinc-600 py-4 italic">Sem membros nesta célula.</p>
                    ) : members.map(member => (
                        <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAttendance(member.id)}
                            className={`
                                w-full flex items-center gap-4 p-3 rounded-2xl transition-all border
                                ${attendance[member.id]
                                    ? 'bg-primary/10 border-primary/20 border-l-4 border-l-primary'
                                    : 'bg-zinc-950/30 border-zinc-800 opacity-60'
                                }
                            `}
                        >
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={member.photoUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {member.fullName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className={`flex-1 text-left text-sm font-bold ${attendance[member.id] ? 'text-white' : 'text-zinc-600 italic line-through'}`}>
                                {member.fullName}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${attendance[member.id] ? 'bg-primary text-primary-foreground shadow-md' : 'bg-zinc-800 text-zinc-600'}`}>
                                {attendance[member.id] ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Visitors Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Visitantes
                    </CardTitle>
                    <CardDescription className="text-zinc-500">Adicione pessoas novas</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="space-y-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                        <Input
                            placeholder="Nome do Visitante"
                            value={newVisitor.name}
                            onChange={e => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                            className="h-12 rounded-xl bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                        />
                        <Input
                            placeholder="WhatsApp (Ex: 12999999999)"
                            value={newVisitor.phone}
                            onChange={e => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-12 rounded-xl bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                        />
                        <Button
                            variant="outline"
                            onClick={addVisitor}
                            disabled={newVisitor.name.trim().length < 2}
                            className="w-full h-11 rounded-xl border-primary text-primary font-bold hover:bg-primary/5"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Visitante
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {visitors.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                                        {v.name[0]}
                                    </div>
                                    <div className="text-sm font-bold text-white">{v.name}</div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeVisitor(i)} className="text-red-400 h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Checklist Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <Check className="h-5 w-5 text-primary" />
                        Checklist
                    </CardTitle>
                    <CardDescription className="text-zinc-500">Momentos da reunião</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3">
                    {[
                        { id: 'icebreaker', label: 'Quebra-gelo' },
                        { id: 'worship', label: 'Louvor' },
                        { id: 'word', label: 'Palavra' },
                        { id: 'prayer', label: 'Oração' },
                        { id: 'snack', label: 'Lanche/Comunhão' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                            className={`
                                flex items-center gap-2 p-3 rounded-xl transition-all border text-xs font-bold
                                ${checklist[item.id as keyof typeof checklist]
                                    ? 'bg-primary/20 border-primary/40 text-white'
                                    : 'bg-zinc-950/30 border-zinc-800 text-zinc-500'
                                }
                            `}
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${checklist[item.id as keyof typeof checklist] ? 'bg-primary border-primary' : 'border-zinc-700'}`}>
                                {checklist[item.id as keyof typeof checklist] && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            {item.label}
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Metrics Section */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Frutos
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                        <Label className="font-bold text-white">Decisões por Cristo</Label>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-zinc-800 text-white" onClick={() => setDecisionsCount(prev => Math.max(0, prev - 1))}>
                                <Minus className="h-5 w-5" />
                            </Button>
                            <span className="w-4 text-center text-xl font-black text-primary">{decisionsCount}</span>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-primary text-primary" onClick={() => setDecisionsCount(prev => prev + 1)}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Observations */}
            <Card className="border-none shadow-md overflow-hidden bg-zinc-900 rounded-[2rem]">
                <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Observações
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <Textarea
                        placeholder="Como foi a reunião? Algum pedido de oração especial?"
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                        className="rounded-2xl bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[100px]"
                    />
                </CardContent>
            </Card>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent z-20 pointer-events-none">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                            SALVANDO...
                        </>
                    ) : (
                        'SALVAR REUNIÃO'
                    )}
                </Button>
            </div>
        </div>
    )
}
