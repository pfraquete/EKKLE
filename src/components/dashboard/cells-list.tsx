'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Home,
    Search,
    CheckCircle2,
    Clock,
    ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Cell {
    id: string
    name: string
    leaderName: string
    membersCount: number
    lastMeetingDate: string | null
    hasRecentReport: boolean
}

interface CellsListProps {
    cells: Cell[]
}

export function CellsList({ cells }: CellsListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Filter cells based on search term
    const filteredCells = cells.filter(cell => {
        const searchLower = searchTerm.toLowerCase()
        return (
            cell.name.toLowerCase().includes(searchLower) ||
            cell.leaderName.toLowerCase().includes(searchLower)
        )
    })

    return (
        <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold">Gerenciamento de Células</CardTitle>
                        <CardDescription>Acompanhe o desempenho de cada grupo</CardDescription>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar célula ou líder..."
                            className="pl-10 h-10 bg-background rounded-xl border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {filteredCells.length === 0 ? (
                        <div className="p-20 text-center">
                            <Home className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">
                                {searchTerm ? 'Nenhuma célula encontrada.' : 'Nenhuma célula cadastrada.'}
                            </p>
                        </div>
                    ) : (
                        filteredCells.map(cell => (
                            <Link
                                key={cell.id}
                                href={`/celulas/${cell.id}`}
                                className="flex items-center justify-between p-5 hover:bg-muted/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg
                                        ${cell.hasRecentReport ? 'bg-primary' : 'bg-amber-400 shadow-amber-200'}
                                    `}>
                                        {cell.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{cell.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Líder: {cell.leaderName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-bold text-foreground">{cell.membersCount} membros</p>
                                        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                            {isMounted && cell.lastMeetingDate ? format(new Date(cell.lastMeetingDate), "dd MMM", { locale: ptBR }) : 'Sem reunião'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {cell.hasRecentReport ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-amber-500" />
                                        )}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
