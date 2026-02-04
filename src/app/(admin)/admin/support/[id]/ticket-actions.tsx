'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    MoreHorizontal,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    UserCog,
    Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    changeTicketStatus,
    changeTicketPriority,
    assignTicket,
    type TicketStatus,
    type TicketPriority
} from '@/actions/super-admin/tickets'

interface TicketActionsProps {
    ticketId: string
    currentStatus: TicketStatus
    currentPriority: TicketPriority
    currentAssignedTo: string | null
    admins: Array<{ id: string; full_name: string; email: string }>
}

const statusOptions: Array<{ value: TicketStatus; label: string; icon: typeof Clock; color: string }> = [
    { value: 'open', label: 'Aberto', icon: Clock, color: 'text-blue-400' },
    { value: 'in_progress', label: 'Em Andamento', icon: Clock, color: 'text-yellow-400' },
    { value: 'waiting_response', label: 'Aguardando Resposta', icon: Clock, color: 'text-purple-400' },
    { value: 'resolved', label: 'Resolvido', icon: CheckCircle, color: 'text-emerald-400' },
    { value: 'closed', label: 'Fechado', icon: XCircle, color: 'text-zinc-400' }
]

const priorityOptions: Array<{ value: TicketPriority; label: string; color: string }> = [
    { value: 'low', label: 'Baixa', color: 'text-zinc-400' },
    { value: 'medium', label: 'Media', color: 'text-blue-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400' }
]

export function TicketActions({
    ticketId,
    currentStatus,
    currentPriority,
    currentAssignedTo,
    admins
}: TicketActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [showPriorityMenu, setShowPriorityMenu] = useState(false)
    const [showAssignMenu, setShowAssignMenu] = useState(false)

    const handleStatusChange = (status: TicketStatus) => {
        setShowStatusMenu(false)
        startTransition(async () => {
            await changeTicketStatus(ticketId, status)
            router.refresh()
        })
    }

    const handlePriorityChange = (priority: TicketPriority) => {
        setShowPriorityMenu(false)
        startTransition(async () => {
            await changeTicketPriority(ticketId, priority)
            router.refresh()
        })
    }

    const handleAssign = (adminId: string | null) => {
        setShowAssignMenu(false)
        startTransition(async () => {
            await assignTicket(ticketId, adminId)
            router.refresh()
        })
    }

    const currentStatusOption = statusOptions.find(s => s.value === currentStatus)
    const currentPriorityOption = priorityOptions.find(p => p.value === currentPriority)
    const currentAdmin = admins.find(a => a.id === currentAssignedTo)

    return (
        <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowStatusMenu(!showStatusMenu)
                        setShowPriorityMenu(false)
                        setShowAssignMenu(false)
                    }}
                    disabled={isPending}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50'
                    )}
                >
                    {currentStatusOption && (
                        <>
                            <currentStatusOption.icon className={cn('h-4 w-4', currentStatusOption.color)} />
                            <span className="text-zinc-200">{currentStatusOption.label}</span>
                        </>
                    )}
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>

                {showStatusMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowStatusMenu(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(option.value)}
                                    disabled={option.value === currentStatus}
                                    className={cn(
                                        'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                        option.value === currentStatus
                                            ? 'text-zinc-500 cursor-default'
                                            : 'text-zinc-200 hover:bg-zinc-700'
                                    )}
                                >
                                    <option.icon className={cn('h-4 w-4', option.color)} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Priority Dropdown */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowPriorityMenu(!showPriorityMenu)
                        setShowStatusMenu(false)
                        setShowAssignMenu(false)
                    }}
                    disabled={isPending}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50'
                    )}
                >
                    <Flag className={cn('h-4 w-4', currentPriorityOption?.color)} />
                    <span className="text-zinc-200">{currentPriorityOption?.label}</span>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>

                {showPriorityMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPriorityMenu(false)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                            {priorityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handlePriorityChange(option.value)}
                                    disabled={option.value === currentPriority}
                                    className={cn(
                                        'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                        option.value === currentPriority
                                            ? 'text-zinc-500 cursor-default'
                                            : 'text-zinc-200 hover:bg-zinc-700'
                                    )}
                                >
                                    <span className={cn(
                                        'w-2 h-2 rounded-full',
                                        option.value === 'low' && 'bg-zinc-400',
                                        option.value === 'medium' && 'bg-blue-400',
                                        option.value === 'high' && 'bg-orange-400',
                                        option.value === 'urgent' && 'bg-red-400'
                                    )} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Assign Dropdown */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowAssignMenu(!showAssignMenu)
                        setShowStatusMenu(false)
                        setShowPriorityMenu(false)
                    }}
                    disabled={isPending}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50'
                    )}
                >
                    <UserCog className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-200 max-w-[100px] truncate">
                        {currentAdmin?.full_name || 'Nao atribuido'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>

                {showAssignMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowAssignMenu(false)}
                        />
                        <div className="absolute right-0 mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                            <button
                                onClick={() => handleAssign(null)}
                                className={cn(
                                    'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                    !currentAssignedTo
                                        ? 'text-zinc-500 cursor-default'
                                        : 'text-zinc-200 hover:bg-zinc-700'
                                )}
                            >
                                <span className="text-zinc-500">Nao atribuido</span>
                            </button>
                            <div className="border-t border-zinc-700 my-1" />
                            {admins.map((admin) => (
                                <button
                                    key={admin.id}
                                    onClick={() => handleAssign(admin.id)}
                                    disabled={admin.id === currentAssignedTo}
                                    className={cn(
                                        'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                                        admin.id === currentAssignedTo
                                            ? 'text-orange-400 bg-orange-500/10'
                                            : 'text-zinc-200 hover:bg-zinc-700'
                                    )}
                                >
                                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                                        <span className="text-xs text-zinc-300">
                                            {admin.full_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="truncate">{admin.full_name}</p>
                                        <p className="text-xs text-zinc-500 truncate">{admin.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
