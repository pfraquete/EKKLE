'use client'

import { useState, useTransition, useRef } from 'react'
import { X, Upload, Loader2, Image as ImageIcon, Check } from 'lucide-react'
import { saveTithe } from '@/actions/tithes'
import { createClient } from '@/lib/supabase/client'

interface TitheData {
    id: string
    year: number
    month: number
    amount_cents: number
    receipt_url: string | null
    payment_method: string | null
    status: 'PENDING' | 'CONFIRMED'
    notes: string | null
}

interface TitheUploadModalProps {
    month: number
    monthName: string
    year: number
    existingTithe: TitheData | null
    onClose: () => void
}

export function TitheUploadModal({
    month,
    monthName,
    year,
    existingTithe,
    onClose
}: TitheUploadModalProps) {
    const [amount, setAmount] = useState(
        existingTithe?.amount_cents ? (existingTithe.amount_cents / 100).toFixed(2) : ''
    )
    const [paymentMethod, setPaymentMethod] = useState<string>(
        existingTithe?.payment_method || 'pix'
    )
    const [notes, setNotes] = useState(existingTithe?.notes || '')
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingTithe?.receipt_url || null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                setError('Apenas imagens ou PDF são permitidos')
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Arquivo muito grande (máximo 5MB)')
                return
            }

            setReceiptFile(file)
            setError(null)

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setPreviewUrl(e.target?.result as string)
                }
                reader.readAsDataURL(file)
            } else {
                setPreviewUrl(null)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const amountCents = Math.round(parseFloat(amount) * 100)
        if (isNaN(amountCents) || amountCents <= 0) {
            setError('Informe um valor válido')
            return
        }

        startTransition(async () => {
            try {
                let receiptUrl = existingTithe?.receipt_url || null

                // Upload file if selected
                if (receiptFile) {
                    setUploading(true)
                    const supabase = createClient()

                    const fileExt = receiptFile.name.split('.').pop()
                    const fileName = `${year}-${month}-${Date.now()}.${fileExt}`
                    const filePath = `tithes/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('church-assets')
                        .upload(filePath, receiptFile)

                    if (uploadError) {
                        throw new Error('Erro ao enviar comprovante')
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('church-assets')
                        .getPublicUrl(filePath)

                    receiptUrl = publicUrl
                    setUploading(false)
                }

                // Save tithe
                const result = await saveTithe({
                    year,
                    month,
                    amount_cents: amountCents,
                    receipt_url: receiptUrl,
                    payment_method: paymentMethod as any,
                    notes: notes || null,
                })

                if (!result.success) {
                    setError(result.error || 'Erro ao salvar')
                    return
                }

                setSuccess(true)
                setTimeout(() => {
                    onClose()
                    window.location.reload()
                }, 1500)
            } catch (err) {
                console.error('Error saving tithe:', err)
                setError('Erro ao salvar dízimo')
                setUploading(false)
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-black text-foreground">
                            {existingTithe ? 'Editar Dízimo' : 'Registrar Dízimo'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {monthName} de {year}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Dízimo Registrado!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Seu dízimo foi enviado para confirmação
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Valor do Dízimo
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Forma de Pagamento
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'pix', label: 'PIX' },
                                    { value: 'transfer', label: 'Transferência' },
                                    { value: 'cash', label: 'Dinheiro' },
                                    { value: 'other', label: 'Outro' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPaymentMethod(option.value)}
                                        className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                                            paymentMethod === option.value
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background border-border text-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Comprovante (opcional)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {previewUrl ? (
                                <div className="relative">
                                    <div className="relative h-40 rounded-xl overflow-hidden bg-muted border border-border">
                                        {previewUrl.startsWith('data:image') || previewUrl.includes('supabase') ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Arquivo PDF selecionado
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptFile(null)
                                            setPreviewUrl(null)
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-all"
                                >
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        Clique para enviar
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Alguma observação..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending || uploading}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {(isPending || uploading) ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {uploading ? 'Enviando...' : 'Salvando...'}
                                </>
                            ) : (
                                'Salvar Dízimo'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
