'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { confirmTithe } from '@/actions/tithes'

interface TitheConfirmButtonProps {
    titheId: string
}

export function TitheConfirmButton({ titheId }: TitheConfirmButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [confirmed, setConfirmed] = useState(false)

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await confirmTithe(titheId)
            if (result.success) {
                setConfirmed(true)
            }
        })
    }

    if (confirmed) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                Confirmado
            </span>
        )
    }

    return (
        <button
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Confirmando...
                </>
            ) : (
                <>
                    <Check className="w-3.5 h-3.5" />
                    Confirmar
                </>
            )}
        </button>
    )
}
