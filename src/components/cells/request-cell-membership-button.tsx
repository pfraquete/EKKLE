'use client'

import { useState } from 'react'
import { requestCellMembership } from '@/actions/cell-requests'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, Send } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface RequestCellMembershipButtonProps {
    cellId: string
    cellName: string
    isAlreadyMember: boolean
    hasPendingRequest: boolean
}

export function RequestCellMembershipButton({
    cellId,
    cellName,
    isAlreadyMember,
    hasPendingRequest,
}: RequestCellMembershipButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const result = await requestCellMembership(cellId, message)

        setLoading(false)

        if (result.success) {
            setSuccess(true)
            setTimeout(() => {
                setOpen(false)
                setSuccess(false)
                setMessage('')
            }, 2000)
        } else {
            setError(result.error || 'Erro ao enviar solicitação')
        }
    }

    if (isAlreadyMember) {
        return null
    }

    if (hasPendingRequest) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-amber-800 font-semibold">⏳ Solicitação Pendente</p>
                <p className="text-amber-600 text-sm mt-1">
                    Sua solicitação está aguardando aprovação do líder
                </p>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                    <Send className="w-5 h-5 mr-2" />
                    Solicitar Participação
                </Button>
            </DialogTrigger>
            <DialogContent>
                {success ? (
                    <div className="py-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Solicitação Enviada!</h3>
                        <p className="text-muted-foreground">
                            O líder da célula receberá sua solicitação e entrará em contato em breve.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Solicitar Participação</DialogTitle>
                            <DialogDescription>
                                Você deseja participar da célula <strong>{cellName}</strong>?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="message">
                                    Mensagem (Opcional)
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="Conte um pouco sobre você ou porque deseja participar desta célula..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="mt-2"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Enviar Solicitação
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
