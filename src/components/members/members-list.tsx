'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import {
    Users,
    Search,
    Phone,
    Mail,
    MoreVertical,
    CalendarDays
} from 'lucide-react'

interface Member {
    id: string
    full_name: string
    photo_url: string | null
    phone: string | null
    email: string | null
    member_stage: string
    last_attendance: string | null
}

interface MembersListProps {
    members: Member[]
    itemsPerPage?: number
}

export function MembersList({ members, itemsPerPage = 10 }: MembersListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [stageFilter, setStageFilter] = useState<string | null>(null)

    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'VISITOR': return <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">Visitante</Badge>
            case 'REGULAR_VISITOR': return <Badge variant="outline" className="text-amber-300 border-amber-500/30 bg-amber-500/10">Frequenta</Badge>
            case 'MEMBER': return <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10">Membro</Badge>
            case 'LEADER': return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Líder</Badge>
            default: return null
        }
    }

    // Filter and search members
    const filteredMembers = useMemo(() => {
        let result = members

        // Apply stage filter
        if (stageFilter) {
            result = result.filter(m => m.member_stage === stageFilter)
        }

        // Apply search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            result = result.filter(m =>
                m.full_name.toLowerCase().includes(searchLower) ||
                m.phone?.includes(searchTerm) ||
                m.email?.toLowerCase().includes(searchLower)
            )
        }

        return result
    }, [members, searchTerm, stageFilter])

    // Pagination
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

    // Count by stage
    const stageCounts = useMemo(() => {
        return {
            VISITOR: members.filter(m => m.member_stage === 'VISITOR').length,
            MEMBER: members.filter(m => m.member_stage === 'MEMBER').length,
        }
    }, [members])

    // Reset to page 1 when filter/search changes
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleStageFilter = (stage: string | null) => {
        setStageFilter(stage)
        setCurrentPage(1)
    }

    return (
        <>
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar membro..."
                    className="pl-10 h-12 bg-background rounded-2xl border-border shadow-sm"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            {/* Stats & Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                <Badge
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-bold cursor-pointer transition-colors ${stageFilter === null
                        ? 'bg-primary/10 text-primary border-none'
                        : 'bg-transparent text-muted-foreground border-border'
                        }`}
                    variant={stageFilter === null ? 'default' : 'outline'}
                    onClick={() => handleStageFilter(null)}
                >
                    Todos ({members.length})
                </Badge>
                <Badge
                    variant="outline"
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-bold cursor-pointer transition-colors ${stageFilter === 'VISITOR'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'text-muted-foreground border-border'
                        }`}
                    onClick={() => handleStageFilter('VISITOR')}
                >
                    Visitantes ({stageCounts.VISITOR})
                </Badge>
                <Badge
                    variant="outline"
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-bold cursor-pointer transition-colors ${stageFilter === 'MEMBER'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'text-muted-foreground border-border'
                        }`}
                    onClick={() => handleStageFilter('MEMBER')}
                >
                    Membros ({stageCounts.MEMBER})
                </Badge>
            </div>

            {/* Members List */}
            <div className="grid grid-cols-1 gap-4">
                {paginatedMembers.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                        <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">
                            {searchTerm || stageFilter ? 'Nenhum membro encontrado.' : 'Nenhum membro cadastrado.'}
                        </p>
                    </div>
                ) : (
                    paginatedMembers.map(member => (
                        <Link key={member.id} href={`/minha-celula/membros/${member.id}`}>
                            <Card className="border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm shrink-0">
                                        <AvatarImage src={member.photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-foreground truncate">{member.full_name}</p>
                                            {getStageBadge(member.member_stage)}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                            {member.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {member.phone}
                                                </span>
                                            )}
                                            {member.email && !member.phone && (
                                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                    <Mail className="h-3 w-3" />
                                                    {member.email}
                                                </span>
                                            )}
                                            {member.last_attendance && (
                                                <span className="flex items-center gap-1 text-primary/80 shrink-0">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {new Date(member.last_attendance + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground/50">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {filteredMembers.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredMembers.length}
                />
            )}
        </>
    )
}
