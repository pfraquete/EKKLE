'use client'

import { useState, useTransition } from 'react'
import { Loader2, Check, Trash2 } from 'lucide-react'
import { updateChurchPix, removeChurchPix } from '@/actions/church-pix'

interface PixConfigFormProps {
    initialPixKey: string
    initialPixKeyType: string
}

const pixKeyTypes = [
    { value: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
    { value: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
    { value: 'email', label: 'E-mail', placeholder: 'email@exemplo.com' },
    { value: 'phone', label: 'Telefone', placeholder: '+55 11 99999-9999' },
    { value: 'random', label: 'Chave Aleatória', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
]

export function PixConfigForm({ initialPixKey, initialPixKeyType }: PixConfigFormProps) {
    const [pixKey, setPixKey] = useState(initialPixKey)
    const [pixKeyType, setPixKeyType] = useState(initialPixKeyType)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isRemoving, setIsRemoving] = useState(false)

    const selectedType = pixKeyTypes.find(t => t.value === pixKeyType)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (!pixKey.trim()) {
            setError('Informe a chave PIX')
            return
        }

        startTransition(async () => {
            const result = await updateChurchPix({
                pix_key: pixKey,
                pix_key_type: pixKeyType as any,
            })

            if (result.success) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(result.error || 'Erro ao salvar')
            }
        })
    }

    const handleRemove = () => {
        if (!confirm('Tem certeza que deseja remover a chave PIX?')) return

        setIsRemoving(true)
        startTransition(async () => {
            const result = await removeChurchPix()
            if (result.success) {
                setPixKey('')
                setPixKeyType('cpf')
            } else {
                setError(result.error || 'Erro ao remover')
            }
            setIsRemoving(false)
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Key Type Selection */}
            <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                    Tipo de Chave
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {pixKeyTypes.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => setPixKeyType(type.value)}
                            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                                pixKeyType === type.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border text-foreground hover:border-primary/50'
                            }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Input */}
            <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                    Chave PIX
                </label>
                <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={selectedType?.placeholder || 'Digite a chave PIX'}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Chave PIX salva com sucesso!
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending && !isRemoving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        'Salvar Chave PIX'
                    )}
                </button>

                {initialPixKey && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isPending}
                        className="h-12 px-4 bg-destructive/10 text-destructive rounded-xl font-bold hover:bg-destructive/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isRemoving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Trash2 className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>
        </form>
    )
}
