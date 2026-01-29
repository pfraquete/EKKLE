'use client'

import { useState, useTransition } from 'react'
import { UserPlus, X, Search, Loader2, Check } from 'lucide-react'
import Image from 'next/image'
import { addToFinanceTeam } from '@/actions/finance-team'

interface Member {
    id: string
    full_name: string
    email: string | null
    photo_url: string | null
}

interface AddFinanceTeamMemberProps {
    availableMembers: Member[]
}

export function AddFinanceTeamMember({ availableMembers }: AddFinanceTeamMemberProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [success, setSuccess] = useState(false)

    const filteredMembers = availableMembers.filter(member =>
        member.full_name.toLowerCase().includes(search.toLowerCase())
    )

    const handleAdd = (profileId: string) => {
        setSelectedId(profileId)
        startTransition(async () => {
            const result = await addToFinanceTeam(profileId)
            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    setIsOpen(false)
                    setSearch('')
                    setSelectedId(null)
                    setSuccess(false)
                }, 1000)
            } else {
                setSelectedId(null)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                <UserPlus className="w-5 h-5" />
                Adicionar Membro
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-black text-foreground">
                                    Adicionar à Equipe
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Selecione um membro da igreja
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    setSearch('')
                                }}
                                className="p-2 rounded-xl hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar membro..."
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="max-h-80 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-muted-foreground">
                                        {availableMembers.length === 0
                                            ? 'Todos os membros já estão na equipe'
                                            : 'Nenhum membro encontrado'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredMembers.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleAdd(member.id)}
                                            disabled={isPending}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors disabled:opacity-50"
                                        >
                                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                                                {member.photo_url ? (
                                                    <Image
                                                        src={member.photo_url}
                                                        alt={member.full_name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                                        {member.full_name[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-bold text-foreground">
                                                    {member.full_name}
                                                </p>
                                                {member.email && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {member.email}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedId === member.id && (
                                                <div className="flex-shrink-0">
                                                    {success ? (
                                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                    ) : (
                                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
