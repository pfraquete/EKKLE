'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import { suspendChurch, reactivateChurch } from '@/actions/super-admin/churches'
import { SuspendChurchDialog } from '@/components/admin/churches/suspend-dialog'

interface ChurchActionsProps {
    churchId: string
    churchName: string
    status: string | null
}

export function ChurchActions({ churchId, churchName, status }: ChurchActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showMenu, setShowMenu] = useState(false)
    const [suspendDialog, setSuspendDialog] = useState(false)

    const handleReactivate = () => {
        startTransition(async () => {
            try {
                await reactivateChurch(churchId)
                setShowMenu(false)
            } catch (error) {
                console.error('Failed to reactivate:', error)
            }
        })
    }

    return (
        <>
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
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                            {status === 'suspended' ? (
                                <button
                                    onClick={handleReactivate}
                                    disabled={isPending}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-700 transition-colors w-full disabled:opacity-50"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Reativar Igreja
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSuspendDialog(true)
                                        setShowMenu(false)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-zinc-700 transition-colors w-full"
                                >
                                    <Ban className="h-4 w-4" />
                                    Suspender Igreja
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <SuspendChurchDialog
                open={suspendDialog}
                onOpenChange={setSuspendDialog}
                churchId={churchId}
                churchName={churchName}
            />
        </>
    )
}
