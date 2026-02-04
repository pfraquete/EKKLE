'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImpersonateButtonProps {
    userId: string
    userName: string
    userEmail: string
    compact?: boolean
}

export function ImpersonateButton({ userId, userName, userEmail, compact = false }: ImpersonateButtonProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImpersonate = async () => {
        if (!reason.trim() || reason.trim().length < 5) {
            setError('Informe um motivo (minimo 5 caracteres)')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/impersonation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: userId,
                    reason: reason.trim()
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Erro ao iniciar impersonacao')
                setIsLoading(false)
                return
            }

            router.push(data.redirectUrl || '/dashboard')
            router.refresh()
        } catch (err) {
            setError('Erro de conexao')
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'transition-colors',
                    compact
                        ? 'p-2 hover:bg-orange-500/20 rounded-lg'
                        : 'flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium'
                )}
                title="Entrar como este usuario"
            >
                <UserCog className={cn('text-orange-400', compact ? 'h-4 w-4' : 'h-4 w-4')} />
                {!compact && 'Entrar como'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isLoading && setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <UserCog className="h-6 w-6 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-100">Impersonar Usuario</h2>
                                    <p className="text-sm text-zinc-400">Voce ira acessar o sistema como este usuario</p>
                                </div>
                            </div>

                            <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-zinc-400">Usuario</p>
                                <p className="font-medium text-zinc-200">{userName}</p>
                                <p className="text-sm text-zinc-500">{userEmail}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Motivo da impersonacao *
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ex: Suporte ao usuario - configuracao de celulas"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                />
                                {error && (
                                    <p className="mt-2 text-sm text-red-400">{error}</p>
                                )}
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                                <p className="text-xs text-yellow-400">
                                    <strong>Atencao:</strong> Todas as acoes realizadas durante a impersonacao serao registradas no log de auditoria.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImpersonate}
                                    disabled={isLoading || !reason.trim()}
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Iniciando...
                                        </>
                                    ) : (
                                        <>
                                            <UserCog className="h-4 w-4" />
                                            Iniciar Sessao
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
