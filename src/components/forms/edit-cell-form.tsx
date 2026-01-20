'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCell } from '@/actions/cells'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ChevronLeft, Home, MapPin, Calendar, Clock, User } from 'lucide-react'

interface EditCellFormProps {
    cell: {
        id: string
        name: string
        address: string | null
        neighborhood: string | null
        dayOfWeek: number | null
        meetingTime: string | null
        leaderId: string | null
    }
    potentialLeaders: { id: string, full_name: string }[]
}

const DAYS = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda' },
    { value: '2', label: 'Terça' },
    { value: '3', label: 'Quarta' },
    { value: '4', label: 'Quinta' },
    { value: '5', label: 'Sexta' },
    { value: '6', label: 'Sábado' },
]

export function EditCellForm({ cell, potentialLeaders }: EditCellFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            await updateCell(cell.id, formData)
            router.push(`/celulas/${cell.id}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar célula.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-foreground">Editar Célula</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                            <Home className="h-6 w-6" />
                        </div>
                        <CardTitle>Dados da Célula</CardTitle>
                        <CardDescription>Atualize as informações de localização e horários.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">Nome da Célula</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={cell.name}
                                required
                                className="h-12 bg-muted/40 border-border rounded-xl font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dayOfWeek" className="text-xs font-bold text-muted-foreground uppercase">Dia da Semana</Label>
                                <Select name="dayOfWeek" defaultValue={cell.dayOfWeek?.toString()}>
                                    <SelectTrigger className="h-12 bg-muted/40 border-border rounded-xl font-medium">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map(day => (
                                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meetingTime" className="text-xs font-bold text-muted-foreground uppercase">Horário</Label>
                                <Input
                                    id="meetingTime"
                                    name="meetingTime"
                                    type="time"
                                    defaultValue={cell.meetingTime?.slice(0, 5)}
                                    className="h-12 bg-muted/40 border-border rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="neighborhood" className="text-xs font-bold text-muted-foreground uppercase">Bairro</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="neighborhood"
                                    name="neighborhood"
                                    defaultValue={cell.neighborhood || ''}
                                    className="h-12 pl-10 bg-muted/40 border-border rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase">Endereço Completo</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={cell.address || ''}
                                className="h-12 bg-muted/40 border-border rounded-xl font-medium"
                            />
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Liderança
                            </h4>
                            <div className="space-y-2">
                                <Label htmlFor="leaderId" className="text-xs font-bold text-muted-foreground uppercase">Responsável</Label>
                                <Select name="leaderId" defaultValue={cell.leaderId || undefined}>
                                    <SelectTrigger className="h-12 bg-muted/40 border-border rounded-xl font-medium">
                                        <SelectValue placeholder="Selecione um líder..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {potentialLeaders.map(leader => (
                                            <SelectItem key={leader.id} value={leader.id}>{leader.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                SALVANDO...
                            </>
                        ) : (
                            'ATUALIZAR CÉLULA'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
