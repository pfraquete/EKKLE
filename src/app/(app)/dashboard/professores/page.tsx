'use client'

import { useEffect, useState, useTransition } from 'react'
import { getTeachers, getEligibleMembers, setTeacherStatus } from '@/actions/teacher'
import { GraduationCap, Plus, UserMinus, Users, Search, BookOpen, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Member {
    id: string
    full_name: string
    email: string
    photo_url: string | null
    is_teacher: boolean
    role: string
}

export default function ProfessoresPage() {
    const [teachers, setTeachers] = useState<Member[]>([])
    const [eligibleMembers, setEligibleMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isPending, startTransition] = useTransition()
    const [pendingId, setPendingId] = useState<string | null>(null)

    const loadData = async () => {
        setLoading(true)
        const [teachersResult, eligibleResult] = await Promise.all([
            getTeachers(),
            getEligibleMembers()
        ])

        if (teachersResult.success && teachersResult.data) {
            setTeachers(teachersResult.data)
        }

        if (eligibleResult.success && eligibleResult.data) {
            setEligibleMembers(eligibleResult.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleToggleTeacher = async (profileId: string, makeTeacher: boolean) => {
        setPendingId(profileId)
        startTransition(async () => {
            const result = await setTeacherStatus(profileId, makeTeacher)
            if (result.success) {
                await loadData()
            }
            setPendingId(null)
            if (makeTeacher) {
                setShowAddModal(false)
            }
        })
    }

    const filteredEligible = eligibleMembers.filter(m =>
        !m.is_teacher &&
        (m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm font-medium">Carregando professores...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter italic uppercase">Professores</h1>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-2 bg-muted/30 px-3 py-1 rounded-full inline-block">
                        Gerencie quem pode criar e ministrar cursos
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-primary-foreground h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5" />
                    Novo Professor
                </button>
            </div>

            {/* Teachers List */}
            {teachers.length === 0 ? (
                <div className="text-center py-24 bg-card border border-border/50 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <GraduationCap className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30 animate-pulse" />
                    <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter mb-2">Nenhum professor</h3>
                    <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                        Adicione professores para que eles possam criar e ministrar cursos.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-3 bg-primary text-primary-foreground h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Professor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="group bg-card rounded-[2rem] shadow-xl border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-muted/30 flex-shrink-0">
                                        {teacher.photo_url ? (
                                            <Image
                                                src={teacher.photo_url}
                                                alt={teacher.full_name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <GraduationCap className="w-8 h-8 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-lg text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                                            {teacher.full_name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {teacher.email}
                                        </p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg">
                                            <GraduationCap className="w-3 h-3" />
                                            <span className="text-xs font-black uppercase tracking-widest">Professor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-0">
                                <button
                                    onClick={() => handleToggleTeacher(teacher.id, false)}
                                    disabled={isPending && pendingId === teacher.id}
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isPending && pendingId === teacher.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserMinus className="w-4 h-4" />
                                            Remover Professor
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Teacher Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    />
                    <div className="relative bg-card rounded-[2.5rem] shadow-2xl border border-border/50 w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-border/50">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">
                                Adicionar Professor
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Selecione um membro para tornar professor
                            </p>
                        </div>

                        <div className="p-4 border-b border-border/50">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredEligible.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground text-sm">
                                        {searchTerm ? 'Nenhum membro encontrado' : 'Todos os membros já são professores'}
                                    </p>
                                </div>
                            ) : (
                                filteredEligible.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-background flex-shrink-0">
                                            {member.photo_url ? (
                                                <Image
                                                    src={member.photo_url}
                                                    alt={member.full_name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground line-clamp-1">
                                                {member.full_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {member.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleTeacher(member.id, true)}
                                            disabled={isPending && pendingId === member.id}
                                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isPending && pendingId === member.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Adicionar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-border/50">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-full h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors font-bold text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
