'use client'

import { useState, useEffect, useCallback } from 'react'
import { AtSign, Check, X, Loader2 } from 'lucide-react'
import { checkNicknameAvailable, setNickname } from '@/actions/direct-messages'

interface NicknameFormProps {
    currentNickname?: string | null
    onSuccess?: (nickname: string) => void
}

export function NicknameForm({ currentNickname, onSuccess }: NicknameFormProps) {
    const [nickname, setNicknameValue] = useState(currentNickname || '')
    const [checking, setChecking] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Debounced check for availability
    const checkAvailability = useCallback(async (value: string) => {
        if (value.length < 3) {
            setIsAvailable(null)
            return
        }

        // Don't check if it's the same as current
        if (value.toLowerCase() === currentNickname?.toLowerCase()) {
            setIsAvailable(true)
            return
        }

        setChecking(true)
        const available = await checkNicknameAvailable(value)
        setIsAvailable(available)
        setChecking(false)
    }, [currentNickname])

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (nickname.length >= 3) {
                checkAvailability(nickname)
            }
        }, 500)

        return () => clearTimeout(timeout)
    }, [nickname, checkAvailability])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!nickname.trim() || nickname.length < 3) {
            setError('Nickname deve ter pelo menos 3 caracteres')
            return
        }

        if (isAvailable === false) {
            setError('Este nickname já está em uso')
            return
        }

        setSaving(true)
        setError(null)

        const result = await setNickname(nickname)

        if (result.success) {
            onSuccess?.(nickname.toLowerCase())
        } else {
            setError(result.error || 'Erro ao salvar nickname')
        }

        setSaving(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 20)

        setNicknameValue(value)
        setIsAvailable(null)
        setError(null)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Seu Nickname
                </label>
                <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={nickname}
                        onChange={handleChange}
                        placeholder="seunickname"
                        disabled={saving}
                        className="w-full bg-muted border border-border rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {checking && (
                            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        )}
                        {!checking && isAvailable === true && nickname.length >= 3 && (
                            <Check className="w-4 h-4 text-green-500" />
                        )}
                        {!checking && isAvailable === false && (
                            <X className="w-4 h-4 text-red-500" />
                        )}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                    Apenas letras minúsculas, números e underscore. Mínimo 3 caracteres.
                </p>
                {error && (
                    <p className="text-xs text-destructive mt-1.5">{error}</p>
                )}
                {!checking && isAvailable === false && !error && (
                    <p className="text-xs text-destructive mt-1.5">
                        Este nickname já está em uso
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={saving || checking || nickname.length < 3 || isAvailable === false}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {saving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    'Salvar Nickname'
                )}
            </button>
        </form>
    )
}
