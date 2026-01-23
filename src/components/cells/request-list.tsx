'use client'

import { useState } from 'react'
import { approveCellRequest, rejectCellRequest } from '@/actions/join-cell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Check, X, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RequestListProps {
    requests: {
        id: string
        created_at: string
        status: string
        profile: {
            id: string
            full_name: string
            photo_url: string | null
            phone: string | null
        }
        cell: { name: string }
    }[]
}

export function RequestList({ requests }: RequestListProps) {
    const [processing, setProcessing] = useState<Record<string, 'approve' | 'reject' | null>>({})
    const { toast } = useToast()

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
                <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300">Nenhuma solicitação pendente</h3>
                <p className="text-zinc-500 max-w-sm mt-2">
                    Quando alguém pedir para entrar na sua célula, aparecerá aqui.
                </p>
            </div>
        )
    }

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessing(prev => ({ ...prev, [requestId]: action }))
        try {
            if (action === 'approve') {
                await approveCellRequest(requestId)
                toast({ title: "Membro Aceito!", description: "O membro foi adicionado à célula.", variant: 'default' })
            } else {
                await rejectCellRequest(requestId)
                toast({ title: "Solicitação Rejeitada", description: "A solicitação foi removida.", variant: 'default' })
            }
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setProcessing(prev => ({ ...prev, [requestId]: null }))
        }
    }

    return (
        <div className="space-y-4">
            {requests.map(request => (
                <Card key={request.id} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-zinc-800">
                                <AvatarImage src={request.profile.photo_url || ''} />
                                <AvatarFallback><User className="h-6 w-6 text-zinc-500" /></AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="font-bold text-zinc-100">{request.profile.full_name}</h4>
                                <p className="text-xs text-zinc-500">
                                    Solicitado {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                                {request.profile.phone && (
                                    <p className="text-xs text-zinc-400 mt-0.5">{request.profile.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                                onClick={() => handleAction(request.id, 'reject')}
                                disabled={!!processing[request.id]}
                            >
                                {processing[request.id] === 'reject' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <X className="h-5 w-5" />
                                )}
                            </Button>
                            <Button
                                size="icon"
                                className="h-10 w-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/20"
                                onClick={() => handleAction(request.id, 'approve')}
                                disabled={!!processing[request.id]}
                            >
                                {processing[request.id] === 'approve' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Check className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
