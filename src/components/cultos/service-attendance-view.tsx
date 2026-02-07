'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createServiceAttendance, getServiceAttendanceByDate, ServiceAttendanceData } from '@/actions/service-attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, UserPlus, X } from 'lucide-react'

interface ServiceAttendanceViewProps {
    churchId: string
    initialDate: string
    initialData: ServiceAttendanceData
}

export function ServiceAttendanceView({ churchId, initialDate, initialData }: ServiceAttendanceViewProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [members, setMembers] = useState(initialData.members)
    const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
        return Object.fromEntries(
            initialData.members.map(member => [
                member.id,
                initialData.attendanceByProfileId[member.id] ?? true
            ])
        )
    })
    const [visitors, setVisitors] = useState(initialData.visitors)
    const [newVisitor, setNewVisitor] = useState({ name: '', phone: '' })
    const [feedback, setFeedback] = useState<string | null>(null)

    const presentCount = useMemo(() => {
        return Object.values(attendance).filter(Boolean).length
    }, [attendance])

    const totalCount = members.length

    const handleDateChange = (value: string) => {
        setSelectedDate(value)
        setFeedback(null)
        startTransition(async () => {
            try {
                const data = await getServiceAttendanceByDate({ churchId, date: value })
                setMembers(data.members)
                setAttendance(Object.fromEntries(
                    data.members.map(member => [
                        member.id,
                        data.attendanceByProfileId[member.id] ?? true
                    ])
                ))
                setVisitors(data.visitors)
            } catch (error) {
                console.error(error)
                setFeedback('Não foi possível carregar a presença para esta data.')
            }
        })
    }

    const toggleAttendance = (memberId: string) => {
        setAttendance(prev => ({ ...prev, [memberId]: !prev[memberId] }))
    }

    const addVisitor = () => {
        if (newVisitor.name.trim().length < 2) return
        setVisitors(prev => [...prev, { ...newVisitor, phone: newVisitor.phone || null }])
        setNewVisitor({ name: '', phone: '' })
    }

    const removeVisitor = (index: number) => {
        setVisitors(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        setFeedback(null)
        startTransition(async () => {
            try {
                await createServiceAttendance({
                    churchId,
                    date: selectedDate,
                    memberAttendance: Object.entries(attendance).map(([profileId, present]) => ({
                        profileId,
                        present
                    })),
                    visitors: visitors.map(visitor => ({
                        name: visitor.name,
                        phone: visitor.phone || undefined
                    }))
                })
                setFeedback('Presença do culto salva com sucesso.')
                router.refresh()
            } catch (error) {
                console.error(error)
                setFeedback('Não foi possível salvar a presença. Tente novamente.')
            }
        })
    }

    const stageBadge = (stage: string) => {
        switch (stage) {
            case 'VISITOR':
                return <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">Visitante</Badge>
            case 'REGULAR_VISITOR':
                return <Badge variant="outline" className="text-amber-300 border-amber-500/30 bg-amber-500/10">Frequenta</Badge>
            case 'MEMBER':
                return <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10">Membro</Badge>
            case 'LEADER':
                return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Líder</Badge>
            default:
                return null
        }
    }

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h2 className="text-lg font-bold text-foreground">Presença no Culto</h2>
                <p className="text-sm text-muted-foreground">Registre os presentes no culto.</p>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground">Data do Culto</CardTitle>
                    <CardDescription>Selecione a data para carregar a lista.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label className="text-xs font-bold text-muted-foreground">DATA</Label>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => handleDateChange(event.target.value)}
                        className="mt-2 h-12 rounded-2xl"
                    />
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center justify-between">
                        <span>Membros</span>
                        <Badge variant="outline" className="font-bold border-primary text-primary">
                            {presentCount}/{totalCount}
                        </Badge>
                    </CardTitle>
                    <CardDescription>Toque para marcar falta ou presença.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {members.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4 italic">Nenhum membro encontrado.</p>
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
                                    {member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className={`text-sm font-bold ${attendance[member.id] ? 'text-foreground' : 'text-muted-foreground italic line-through'}`}>
                                    {member.full_name}
                                </p>
                                <div className="mt-1">
                                    {stageBadge(member.member_stage)}
                                </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${attendance[member.id] ? 'bg-green-500 text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                                {attendance[member.id] ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Visitantes
                    </CardTitle>
                    <CardDescription>Adicione visitantes presentes no culto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border border-dashed">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">NOME DO VISITANTE</Label>
                            <Input
                                value={newVisitor.name}
                                onChange={(event) => setNewVisitor(prev => ({ ...prev, name: event.target.value }))}
                                placeholder="Ex: Maria Silva"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">TELEFONE (opcional)</Label>
                            <Input
                                value={newVisitor.phone}
                                onChange={(event) => setNewVisitor(prev => ({ ...prev, phone: event.target.value }))}
                                placeholder="(12) 99999-9999"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <Button type="button" onClick={addVisitor} className="w-full rounded-xl h-11 font-bold">
                            Adicionar visitante
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {visitors.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center italic">Nenhum visitante adicionado.</p>
                        ) : (
                            visitors.map((visitor, index) => (
                                <div
                                    key={`${visitor.name}-${index}`}
                                    className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{visitor.name}</p>
                                        {visitor.phone && (
                                            <p className="text-xs text-muted-foreground">{visitor.phone}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeVisitor(index)}>
                                        Remover
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {feedback && (
                <Card className="border border-primary/20 bg-primary/5">
                    <CardContent className="py-3 text-sm text-primary font-semibold text-center">
                        {feedback}
                    </CardContent>
                </Card>
            )}

            <Button
                className="w-full h-12 rounded-2xl font-bold"
                onClick={handleSave}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar presença'}
            </Button>
        </div>
    )
}
