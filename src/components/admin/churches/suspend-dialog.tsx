'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { suspendChurch } from '@/actions/super-admin/churches'

interface SuspendChurchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    churchId: string
    churchName: string
}

export function SuspendChurchDialog({
    open,
    onOpenChange,
    churchId,
    churchName
}: SuspendChurchDialogProps) {
    const [reason, setReason] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    if (!open) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!reason.trim()) {
            setError('Por favor, informe o motivo da suspensao')
            return
        }

        startTransition(async () => {
            try {
                await suspendChurch(churchId, reason)
                setReason('')
                onOpenChange(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Falha ao suspender igreja')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-zinc-100">Suspender Igreja</h2>
                            <p className="text-sm text-zinc-400">{churchName}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-200">
                            <strong>Atencao:</strong> Ao suspender esta igreja, todos os membros
                            perderao acesso ao sistema ate que seja reativada.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-zinc-300 mb-2">
                            Motivo da suspensao *
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva o motivo da suspensao..."
                            rows={3}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isPending ? 'Suspendendo...' : 'Confirmar Suspensao'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
