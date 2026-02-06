'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Search, UserPlus } from 'lucide-react'
import { addDepartmentMember } from '@/actions/departments'

interface AddMemberDialogProps {
    departmentId: string
    availableMembers: { id: string; full_name: string; role: string }[]
    existingMemberIds: string[]
}

export function AddMemberDialog({ departmentId, availableMembers, existingMemberIds }: AddMemberDialogProps) {
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [addingId, setAddingId] = useState<string | null>(null)

    const filteredMembers = availableMembers
        .filter(m => !existingMemberIds.includes(m.id))
        .filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()))

    const handleAdd = async (profileId: string) => {
        setAddingId(profileId)
        try {
            const result = await addDepartmentMember(departmentId, profileId)
            if (result.success) {
                toast({ title: 'Membro adicionado', description: 'O membro foi adicionado ao departamento.' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao adicionar membro', variant: 'destructive' })
        } finally {
            setAddingId(null)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="rounded-2xl"
            >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
            </Button>
        )
    }

    return (
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
                <Button variant="ghost" size="sm" onClick={() => { setIsOpen(false); setSearch('') }}>
                    Fechar
                </Button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-border rounded-xl border">
                {filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {search ? 'Nenhum membro encontrado.' : 'Todos os membros já estão neste departamento.'}
                    </p>
                ) : (
                    filteredMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                            <span className="text-sm font-medium">{member.full_name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleAdd(member.id)}
                                disabled={addingId === member.id}
                            >
                                {addingId === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
