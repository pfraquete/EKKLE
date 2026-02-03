'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Home,
    Search,
    CheckCircle2,
    Clock,
    ChevronRight,
    Users,
    Filter,
    SortAsc,
    SortDesc,
    Grid3X3,
    List,
    Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Cell {
    id: string
    name: string
    leaderName: string
    membersCount: number
    lastMeetingDate: string | null
    hasRecentReport: boolean
}

interface ModernCellsListProps {
    cells: Cell[]
}

type SortField = 'name' | 'members' | 'date'
type ViewMode = 'list' | 'grid'

export function ModernCellsList({ cells }: ModernCellsListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isMounted, setIsMounted] = useState(false)
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortAsc, setSortAsc] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'pending'>('all')

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Filter and sort cells
    const filteredCells = useMemo(() => {
        let result = cells.filter(cell => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = cell.name.toLowerCase().includes(searchLower) ||
                cell.leaderName.toLowerCase().includes(searchLower)
            
            if (filterStatus === 'ok') return matchesSearch && cell.hasRecentReport
            if (filterStatus === 'pending') return matchesSearch && !cell.hasRecentReport
            return matchesSearch
        })

        // Sort
        result.sort((a, b) => {
            let comparison = 0
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'members':
                    comparison = a.membersCount - b.membersCount
                    break
                case 'date':
                    const dateA = a.lastMeetingDate ? new Date(a.lastMeetingDate).getTime() : 0
                    const dateB = b.lastMeetingDate ? new Date(b.lastMeetingDate).getTime() : 0
                    comparison = dateA - dateB
                    break
            }
            return sortAsc ? comparison : -comparison
        })

        return result
    }, [cells, searchTerm, sortField, sortAsc, filterStatus])

    const stats = useMemo(() => ({
        total: cells.length,
        withReport: cells.filter(c => c.hasRecentReport).length,
        pending: cells.filter(c => !c.hasRecentReport).length,
        totalMembers: cells.reduce((sum, c) => sum + c.membersCount, 0)
    }), [cells])

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-black-surface/90 via-black-surface/70 to-black-elevated/50 backdrop-blur-xl border-gray-border/50">
            {/* Header */}
            <CardHeader className="relative pb-4 border-b border-gray-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-transparent" />
                
                <div className="relative space-y-4">
                    {/* Title Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 text-gold rounded-2xl flex items-center justify-center shadow-gold-glow-subtle">
                                    <Home className="h-7 w-7" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black-surface rounded-lg flex items-center justify-center border border-gray-border">
                                    <span className="text-xs font-black text-gold">{stats.total}</span>
                                </div>
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white-primary tracking-tight">
                                    Células
                                </CardTitle>
                                <CardDescription className="text-gray-text-secondary flex items-center gap-2">
                                    {stats.totalMembers} membros no total
                                    <span className="w-1 h-1 rounded-full bg-gray-text-muted" />
                                    <span className={cn(
                                        stats.pending > 0 ? 'text-amber-400' : 'text-emerald-400'
                                    )}>
                                        {stats.pending > 0 ? `${stats.pending} pendente${stats.pending > 1 ? 's' : ''}` : 'Todas em dia'}
                                    </span>
                                </CardDescription>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 p-1 bg-black-elevated/80 rounded-xl border border-gray-border/50">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        'p-2 rounded-lg transition-all duration-300',
                                        viewMode === 'list'
                                            ? 'bg-gold text-black-absolute'
                                            : 'text-gray-text-muted hover:text-white-primary'
                                    )}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        'p-2 rounded-lg transition-all duration-300',
                                        viewMode === 'grid'
                                            ? 'bg-gold text-black-absolute'
                                            : 'text-gray-text-muted hover:text-white-primary'
                                    )}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-text-muted" />
                            <Input
                                placeholder="Buscar célula ou líder..."
                                className="pl-11 h-11 bg-black-elevated/80 border-gray-border/50 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 p-1 bg-black-elevated/80 rounded-xl border border-gray-border/50">
                            {[
                                { key: 'all', label: 'Todas', count: stats.total },
                                { key: 'ok', label: 'Em dia', count: stats.withReport },
                                { key: 'pending', label: 'Pendentes', count: stats.pending },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilterStatus(item.key as typeof filterStatus)}
                                    className={cn(
                                        'px-3 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2',
                                        filterStatus === item.key
                                            ? item.key === 'pending' 
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : item.key === 'ok'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-gold text-black-absolute'
                                            : 'text-gray-text-secondary hover:text-white-primary hover:bg-black-surface'
                                    )}
                                >
                                    {item.label}
                                    <span className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded-full',
                                        filterStatus === item.key
                                            ? 'bg-black-absolute/20'
                                            : 'bg-gray-border/50'
                                    )}>
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            className="flex items-center gap-2 px-4 py-2 bg-black-elevated/80 border border-gray-border/50 rounded-xl text-xs font-bold text-gray-text-secondary hover:text-white-primary transition-colors"
                        >
                            {sortAsc ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            Ordenar
                        </button>
                    </div>
                </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-0">
                {filteredCells.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-black-elevated to-black-surface rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-border/50">
                            <Home className="h-12 w-12 text-gray-text-muted" />
                        </div>
                        <p className="text-gray-text-secondary font-medium text-lg">
                            {searchTerm ? 'Nenhuma célula encontrada' : 'Nenhuma célula cadastrada'}
                        </p>
                        <p className="text-gray-text-muted text-sm mt-2">
                            {searchTerm ? 'Tente buscar por outro termo' : 'Crie sua primeira célula para começar'}
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="divide-y divide-gray-border/30">
                        {filteredCells.map((cell, index) => (
                            <Link
                                key={cell.id}
                                href={`/celulas/${cell.id}`}
                                className="flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-gold/5 hover:to-transparent transition-all duration-300 group"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-300',
                                        cell.hasRecentReport 
                                            ? 'bg-gradient-to-br from-gold-dark to-gold text-black-absolute shadow-gold-glow-subtle group-hover:shadow-gold-glow group-hover:scale-105' 
                                            : 'bg-gradient-to-br from-amber-500/30 to-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:border-amber-500/50'
                                    )}>
                                        {cell.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white-primary group-hover:text-gold transition-colors flex items-center gap-2">
                                            {cell.name}
                                            {cell.hasRecentReport && (
                                                <Sparkles className="h-4 w-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </h4>
                                        <p className="text-sm text-gray-text-secondary font-medium mt-0.5">
                                            Líder: {cell.leaderName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Users className="h-4 w-4 text-gray-text-muted" />
                                                <p className="text-lg font-black text-white-primary">{cell.membersCount}</p>
                                            </div>
                                            <p className="text-xs text-gray-text-muted uppercase font-bold tracking-wider">
                                                membros
                                            </p>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                            <p className="text-sm font-bold text-gray-text-secondary">
                                                {isMounted && cell.lastMeetingDate 
                                                    ? format(new Date(cell.lastMeetingDate), "dd MMM", { locale: ptBR }) 
                                                    : '—'
                                                }
                                            </p>
                                            <p className="text-xs text-gray-text-muted uppercase font-bold tracking-wider">
                                                última reunião
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {cell.hasRecentReport ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                <span className="text-xs font-bold text-emerald-400 hidden sm:inline">Em dia</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                                                <Clock className="h-4 w-4 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-400 hidden sm:inline">Pendente</span>
                                            </div>
                                        )}
                                        <ChevronRight className="h-5 w-5 text-gray-text-muted group-hover:text-gold group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredCells.map((cell, index) => (
                            <Link
                                key={cell.id}
                                href={`/celulas/${cell.id}`}
                                className={cn(
                                    'group relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
                                    'bg-gradient-to-br from-black-elevated/80 to-black-elevated/40',
                                    'border border-gray-border/30 hover:border-gold/40',
                                    'hover:shadow-gold-glow hover:scale-[1.02]'
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    {cell.hasRecentReport ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                                            <Clock className="h-4 w-4 text-amber-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className={cn(
                                    'w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl mb-4 transition-all duration-300',
                                    cell.hasRecentReport 
                                        ? 'bg-gradient-to-br from-gold-dark to-gold text-black-absolute shadow-gold-glow-subtle group-hover:shadow-gold-glow' 
                                        : 'bg-gradient-to-br from-amber-500/30 to-amber-500/10 text-amber-400 border border-amber-500/30'
                                )}>
                                    {cell.name[0]}
                                </div>

                                {/* Info */}
                                <h4 className="font-bold text-white-primary group-hover:text-gold transition-colors text-lg">
                                    {cell.name}
                                </h4>
                                <p className="text-sm text-gray-text-secondary font-medium mt-1">
                                    {cell.leaderName}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-border/30">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-text-muted" />
                                        <span className="text-sm font-bold text-white-primary">{cell.membersCount}</span>
                                    </div>
                                    <div className="text-xs text-gray-text-muted">
                                        {isMounted && cell.lastMeetingDate 
                                            ? format(new Date(cell.lastMeetingDate), "dd/MM", { locale: ptBR }) 
                                            : 'Sem reunião'
                                        }
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
