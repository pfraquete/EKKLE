'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserMinus, ShieldCheck, Shield } from 'lucide-react'
import { removeDepartmentMember, updateDepartmentMemberRole, DepartmentMember } from '@/actions/departments'

interface DepartmentMembersListProps {
    departmentId: string
    members: DepartmentMember[]
}

export function DepartmentMembersList({ departmentId, members }: DepartmentMembersListProps) {
    const { toast } = useToast()
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

    const handleRemove = async (profileId: string) => {
        setRemovingId(profileId)
        try {
            const result = await removeDepartmentMember(departmentId, profileId)
            if (result.success) {
                toast({ title: 'Membro removido', description: 'O membro foi removido do departamento.' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao remover membro', variant: 'destructive' })
        } finally {
            setRemovingId(null)
        }
    }

    const handleToggleRole = async (profileId: string, currentRole: 'LEADER' | 'MEMBER') => {
        setUpdatingRoleId(profileId)
        const newRole = currentRole === 'LEADER' ? 'MEMBER' : 'LEADER'
        try {
            const result = await updateDepartmentMemberRole(departmentId, profileId, newRole)
            if (result.success) {
                toast({
                    title: newRole === 'LEADER' ? 'Promovido a líder' : 'Rebaixado a membro',
                    description: newRole === 'LEADER'
                        ? 'O membro agora é líder do departamento.'
                        : 'O líder agora é membro regular.',
                })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao alterar cargo', variant: 'destructive' })
        } finally {
            setUpdatingRoleId(null)
        }
    }

    if (members.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum membro neste departamento.
            </p>
        )
    }

    return (
        <div className="divide-y divide-border">
            {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={member.profile?.photo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {member.profile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{member.profile?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {member.role === 'LEADER' && (
                            <Badge variant="secondary" className="text-xs">Líder</Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleToggleRole(member.profile_id, member.role)}
                            disabled={updatingRoleId === member.profile_id}
                            title={member.role === 'LEADER' ? 'Rebaixar a membro' : 'Promover a líder'}
                        >
                            {updatingRoleId === member.profile_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : member.role === 'LEADER' ? (
                                <Shield className="h-4 w-4" />
                            ) : (
                                <ShieldCheck className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleRemove(member.profile_id)}
                            disabled={removingId === member.profile_id}
                        >
                            {removingId === member.profile_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserMinus className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
