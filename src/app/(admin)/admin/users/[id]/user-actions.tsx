'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, UserX, UserCheck, Crown, Shield, UserCog, User } from 'lucide-react'
import { updateUserRole, toggleUserActive } from '@/actions/super-admin/users'
import { cn } from '@/lib/utils'

interface UserActionsProps {
    user: {
        id: string
        role: string
        is_active: boolean
    }
}

export function UserActions({ user }: UserActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showMenu, setShowMenu] = useState(false)
    const [showRoleMenu, setShowRoleMenu] = useState(false)

    const handleToggleActive = () => {
        startTransition(async () => {
            try {
                await toggleUserActive(user.id)
                setShowMenu(false)
                router.refresh()
            } catch (error) {
                console.error('Failed to toggle active:', error)
            }
        })
    }

    const handleChangeRole = (newRole: string) => {
        startTransition(async () => {
            try {
                await updateUserRole(user.id, newRole)
                setShowRoleMenu(false)
                setShowMenu(false)
                router.refresh()
            } catch (error) {
                console.error('Failed to change role:', error)
            }
        })
    }

    const roles = [
        { value: 'PASTOR', label: 'Pastor', icon: Crown },
        { value: 'DISCIPULADOR', label: 'Discipulador', icon: Shield },
        { value: 'LEADER', label: 'Lider', icon: UserCog },
        { value: 'MEMBER', label: 'Membro', icon: User }
    ]

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
                <MoreHorizontal className="h-5 w-5 text-zinc-400" />
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                            setShowMenu(false)
                            setShowRoleMenu(false)
                        }}
                    />
                    <div className="absolute right-0 mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                        {/* Toggle Active */}
                        <button
                            onClick={handleToggleActive}
                            disabled={isPending}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm w-full transition-colors disabled:opacity-50',
                                user.is_active
                                    ? 'text-red-400 hover:bg-zinc-700'
                                    : 'text-emerald-400 hover:bg-zinc-700'
                            )}
                        >
                            {user.is_active ? (
                                <>
                                    <UserX className="h-4 w-4" />
                                    Desativar Usuario
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Ativar Usuario
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-zinc-700 my-1" />

                        {/* Change Role */}
                        <div className="relative">
                            <button
                                onClick={() => setShowRoleMenu(!showRoleMenu)}
                                className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors w-full"
                            >
                                <span className="flex items-center gap-2">
                                    <UserCog className="h-4 w-4" />
                                    Alterar Role
                                </span>
                                <span className="text-xs text-zinc-500">{user.role}</span>
                            </button>

                            {showRoleMenu && (
                                <div className="absolute left-full top-0 ml-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1">
                                    {roles.map((role) => (
                                        <button
                                            key={role.value}
                                            onClick={() => handleChangeRole(role.value)}
                                            disabled={isPending || role.value === user.role}
                                            className={cn(
                                                'flex items-center gap-2 px-4 py-2 text-sm w-full transition-colors disabled:opacity-50',
                                                role.value === user.role
                                                    ? 'text-orange-400 bg-orange-500/10'
                                                    : 'text-zinc-200 hover:bg-zinc-700'
                                            )}
                                        >
                                            <role.icon className="h-4 w-4" />
                                            {role.label}
                                            {role.value === user.role && (
                                                <span className="ml-auto text-xs">(atual)</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
