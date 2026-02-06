'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserMinus, UserPlus, Plus, Search } from 'lucide-react'
import { enrollStudentInClass, removeStudentFromClass } from '@/actions/ebd'

interface Student {
    id: string
    full_name: string
    photo_url: string | null
    email: string | null
}

interface EbdStudentsListProps {
    courseId: string
    students: Student[]
    availableMembers: { id: string; full_name: string; role: string }[]
}

export function EbdStudentsList({ courseId, students, availableMembers }: EbdStudentsListProps) {
    const { toast } = useToast()
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [addingId, setAddingId] = useState<string | null>(null)
    const [showAdd, setShowAdd] = useState(false)
    const [search, setSearch] = useState('')

    const enrolledIds = students.map(s => s.id)
    const filteredMembers = availableMembers
        .filter(m => !enrolledIds.includes(m.id))
        .filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()))

    const handleRemove = async (profileId: string) => {
        setRemovingId(profileId)
        try {
            const result = await removeStudentFromClass(courseId, profileId)
            if (result.success) {
                toast({ title: 'Aluno removido' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao remover aluno', variant: 'destructive' })
        } finally {
            setRemovingId(null)
        }
    }

    const handleAdd = async (profileId: string) => {
        setAddingId(profileId)
        try {
            const result = await enrollStudentInClass(courseId, profileId)
            if (result.success) {
                toast({ title: 'Aluno matriculado' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao matricular aluno', variant: 'destructive' })
        } finally {
            setAddingId(null)
        }
    }

    return (
        <div className="space-y-4">
            {!showAdd ? (
                <Button variant="outline" className="rounded-2xl" onClick={() => setShowAdd(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Matricular Aluno
                </Button>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar membro..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setSearch('') }}>
                            Fechar
                        </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border rounded-xl border">
                        {filteredMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {search ? 'Nenhum membro encontrado.' : 'Todos já estão matriculados.'}
                            </p>
                        ) : (
                            filteredMembers.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                                    <span className="text-sm font-medium">{m.full_name}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAdd(m.id)} disabled={addingId === m.id}>
                                        {addingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno matriculado nesta classe.</p>
            ) : (
                <div className="divide-y divide-border">
                    {students.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={student.photo_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {student.full_name?.[0] || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{student.full_name}</p>
                                    {student.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleRemove(student.id)}
                                disabled={removingId === student.id}
                            >
                                {removingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
