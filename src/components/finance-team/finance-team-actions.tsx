'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { removeFromFinanceTeam } from '@/actions/finance-team'

interface FinanceTeamActionsProps {
    profileId: string
    memberName?: string
}

export function FinanceTeamActions({ profileId, memberName }: FinanceTeamActionsProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleRemove = () => {
        startTransition(async () => {
            const result = await removeFromFinanceTeam(profileId)
            if (result.success) {
                setShowConfirm(false)
            }
        })
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Remover?</span>
                <button
                    onClick={handleRemove}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        'Sim'
                    )}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-muted text-muted-foreground text-sm font-bold rounded-lg hover:bg-muted/80 transition-colors"
                >
                    Não
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title={`Remover ${memberName || 'membro'} da equipe`}
        >
            <Trash2 className="w-5 h-5" />
        </button>
    )
}
