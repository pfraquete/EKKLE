'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCellInviteLink } from '@/actions/cell-invites'
import { Link2, Copy, Check, Share2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateInviteLinkDialogProps {
    cellId: string
    churchSlug: string
}

const DURATION_OPTIONS = [
    { label: '24 horas', hours: 24 },
    { label: '7 dias', hours: 168 },
    { label: '30 dias', hours: 720, recommended: true },
    { label: 'Personalizado', hours: 0, custom: true },
]

export function CreateInviteLinkDialog({ cellId, churchSlug }: CreateInviteLinkDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDuration, setSelectedDuration] = useState(720) // 30 days default
    const [customDays, setCustomDays] = useState('')
    const [maxUses, setMaxUses] = useState('')
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleCreate = async () => {
        setIsLoading(true)
        try {
            let hours = selectedDuration
            if (selectedDuration === 0 && customDays) {
                hours = parseInt(customDays) * 24
            }

            if (hours <= 0) {
                toast.error('Selecione uma duração válida')
                return
            }

            const result = await createCellInviteLink(
                cellId,
                hours,
                maxUses ? parseInt(maxUses) : undefined
            )

            if (result.success && result.link) {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                const link = `${baseUrl}/convite/${result.link.token}`
                setGeneratedLink(link)
                toast.success('Link de convite gerado com sucesso!')
            } else {
                toast.error(result.error || 'Erro ao gerar link')
            }
        } catch {
            toast.error('Erro ao gerar link de convite')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async () => {
        if (generatedLink) {
            await navigator.clipboard.writeText(generatedLink)
            setCopied(true)
            toast.success('Link copiado!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleShare = async () => {
        if (generatedLink && navigator.share) {
            try {
                await navigator.share({
                    title: 'Convite para célula',
                    text: 'Você foi convidado para participar da nossa célula!',
                    url: generatedLink,
                })
            } catch {
                // User cancelled or share not supported
                handleCopy()
            }
        } else {
            handleCopy()
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            // Reset state when closing
            setGeneratedLink(null)
            setSelectedDuration(720)
            setCustomDays('')
            setMaxUses('')
            setCopied(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-2xl h-14 font-bold border-2 gap-2 text-sm uppercase tracking-widest">
                    <Link2 className="h-5 w-5" />
                    Gerar Link de Convite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                        {generatedLink ? 'Link Gerado!' : 'Gerar Link de Convite'}
                    </DialogTitle>
                    <DialogDescription>
                        {generatedLink
                            ? 'Compartilhe este link com as pessoas que você deseja convidar para sua célula.'
                            : 'Crie um link para convidar novos membros diretamente para sua célula.'}
                    </DialogDescription>
                </DialogHeader>

                {!generatedLink ? (
                    <div className="space-y-6 py-4">
                        {/* Duration Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Validade do link
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {DURATION_OPTIONS.map((option) => (
                                    <button
                                        key={option.hours}
                                        onClick={() => setSelectedDuration(option.hours)}
                                        className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                            selectedDuration === option.hours
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        {option.label}
                                        {option.recommended && (
                                            <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                                                Recomendado
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {selectedDuration === 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Input
                                        type="number"
                                        placeholder="Número de dias"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(e.target.value)}
                                        min={1}
                                        max={365}
                                        className="h-11 rounded-xl"
                                    />
                                    <span className="text-sm text-muted-foreground">dias</span>
                                </div>
                            )}
                        </div>

                        {/* Max Uses (Optional) */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Limite de usos (opcional)
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Ilimitado"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    min={1}
                                    className="h-11 rounded-xl"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">pessoas</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Deixe em branco para permitir usos ilimitados
                            </p>
                        </div>

                        {/* Create Button */}
                        <Button
                            onClick={handleCreate}
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl font-bold text-base"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Gerar Link
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Generated Link Display */}
                        <div className="p-4 bg-muted/50 rounded-xl border border-border">
                            <p className="text-sm font-mono break-all text-center">
                                {generatedLink}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl font-bold gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copiar Link
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleShare}
                                className="flex-1 h-12 rounded-xl font-bold gap-2"
                            >
                                <Share2 className="h-4 w-4" />
                                Compartilhar
                            </Button>
                        </div>

                        {/* Info */}
                        <div className="text-center text-sm text-muted-foreground space-y-1">
                            <p>
                                Expira em:{' '}
                                <span className="font-bold text-foreground">
                                    {selectedDuration === 24
                                        ? '24 horas'
                                        : selectedDuration === 168
                                        ? '7 dias'
                                        : selectedDuration === 720
                                        ? '30 dias'
                                        : `${customDays} dias`}
                                </span>
                            </p>
                            <p>
                                Usos:{' '}
                                <span className="font-bold text-foreground">
                                    {maxUses ? `${maxUses} pessoas` : 'ilimitado'}
                                </span>
                            </p>
                        </div>

                        {/* Create Another Button */}
                        <Button
                            onClick={() => setGeneratedLink(null)}
                            variant="ghost"
                            className="w-full h-10 rounded-xl font-bold text-muted-foreground"
                        >
                            Gerar outro link
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
