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
    ChevronRight,
    Users
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
        <Card className="overflow-hidden">
            <CardHeader className="bg-black-elevated/50 pb-4 border-b border-gray-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
                            <Home className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-white-primary">Gerenciamento de Células</CardTitle>
                            <CardDescription className="text-gray-text-secondary">Acompanhe o desempenho de cada grupo</CardDescription>
                        </div>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-text-muted" />
                        <Input
                            placeholder="Buscar célula ou líder..."
                            className="pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-border">
                    {filteredCells.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-black-elevated rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Home className="h-10 w-10 text-gray-text-muted" />
                            </div>
                            <p className="text-gray-text-secondary font-medium">
                                {searchTerm ? 'Nenhuma célula encontrada.' : 'Nenhuma célula cadastrada.'}
                            </p>
                        </div>
                    ) : (
                        filteredCells.map(cell => (
                            <Link
                                key={cell.id}
                                href={`/celulas/${cell.id}`}
                                className="flex items-center justify-between p-5 hover:bg-black-elevated/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-300
                                        ${cell.hasRecentReport 
                                            ? 'bg-gradient-to-br from-gold-dark to-gold text-black-absolute shadow-gold-glow-subtle group-hover:shadow-gold-glow' 
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        }
                                    `}>
                                        {cell.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white-primary group-hover:text-gold transition-colors">{cell.name}</h4>
                                        <p className="text-sm text-gray-text-secondary font-medium mt-0.5">Líder: {cell.leaderName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Users className="h-4 w-4 text-gray-text-muted" />
                                                <p className="text-sm font-bold text-white-primary">{cell.membersCount}</p>
                                            </div>
                                            <p className="text-xs text-gray-text-muted uppercase font-bold tracking-wider mt-1">
                                                membros
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-text-secondary">
                                                {isMounted && cell.lastMeetingDate 
                                                    ? format(new Date(cell.lastMeetingDate), "dd MMM", { locale: ptBR }) 
                                                    : '—'
                                                }
                                            </p>
                                            <p className="text-xs text-gray-text-muted uppercase font-bold tracking-wider mt-1">
                                                última reunião
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {cell.hasRecentReport ? (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                <span className="text-xs font-bold text-emerald-400 hidden sm:inline">OK</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                <Clock className="h-4 w-4 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-400 hidden sm:inline">Pendente</span>
                                            </div>
                                        )}
                                        <ChevronRight className="h-5 w-5 text-gray-text-muted group-hover:text-gold transition-colors" />
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
