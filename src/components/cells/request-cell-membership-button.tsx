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
                <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                    <Send className="w-4 h-4 mr-3" />
                    Solicitar Conexão
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 rounded-[2.5rem] p-10 max-w-md">
                {success ? (
                    <div className="py-10 text-center animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-black mb-3 tracking-tighter italic">Solicitação Enviada!</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            O líder da célula receberá sua notificação e entrará em contato para integrar você à comunidade.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tighter italic">Conectar à {cellName}</DialogTitle>
                            <DialogDescription className="font-medium pt-2">
                                Escreva uma breve mensagem para o líder da célula para iniciar sua jornada.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-8">
                            <div className="space-y-3">
                                <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Sua Mensagem (Opcional)
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="Ex: Gostaria de conhecer a célula e participar dos encontros semanais..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="bg-muted/50 border-border/50 rounded-2xl p-5 focus:ring-primary/20 transition-all font-medium resize-none shadow-inner"
                                />
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-5 py-4 rounded-2xl text-xs font-bold animate-in shake duration-500">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-col gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-12 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/10"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                                Enviar Solicitação
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="w-full h-12 rounded-full font-black uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted"
                            >
                                Cancelar
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
