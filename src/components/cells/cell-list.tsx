'use client'

import { useState } from 'react'
import { requestCellJoin } from '@/actions/join-cell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, MapPin, Clock, Calendar, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CellListProps {
    cells: {
        id: string
        name: string
        day_of_week: number | null
        meeting_time: string | null
        neighborhood: string | null
        address: string | null
        leader: { full_name: string } | null
    }[]
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function CellList({ cells }: CellListProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
    const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({})
    const { toast } = useToast()

    const handleJoin = async (cellId: string) => {
        setLoadingMap(prev => ({ ...prev, [cellId]: true }))
        try {
            await requestCellJoin(cellId)
            setRequestedMap(prev => ({ ...prev, [cellId]: true }))
            toast({
                title: "Solicitação Enviada!",
                description: "O líder da célula receberá seu pedido.",
                variant: 'default'
            })
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setLoadingMap(prev => ({ ...prev, [cellId]: false }))
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cells.map(cell => (
                <Card key={cell.id} className="bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">{cell.name}</CardTitle>
                        <CardDescription className="text-zinc-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cell.neighborhood || 'Local a definir'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{cell.day_of_week !== null ? DAYS[cell.day_of_week] : 'Dia a definir'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{cell.meeting_time?.slice(0, 5) || 'Horário a definir'}</span>
                            </div>
                            {cell.leader && (
                                <p className="text-xs text-zinc-500 mt-2">
                                    Líder: {cell.leader.full_name}
                                </p>
                            )}
                        </div>

                        {requestedMap[cell.id] ? (
                            <Button disabled className="w-full bg-green-500/20 text-green-500 border-green-500/50">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Solicitado
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleJoin(cell.id)}
                                disabled={loadingMap[cell.id]}
                                className="w-full"
                            >
                                {loadingMap[cell.id] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Participar desta Célula'
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
