'use client'

import { useState } from 'react'
import { approveCellRequest, rejectCellRequest } from '@/actions/cell-requests'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Check, X, User, Link2, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NonRealMember {
    id: string
    full_name: string
    phone: string | null
    member_stage: string
}

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
    nonRealMembers?: NonRealMember[]
}

export function RequestList({ requests, nonRealMembers = [] }: RequestListProps) {
    const [processing, setProcessing] = useState<Record<string, 'approve' | 'reject' | null>>({})
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [expandedLinking, setExpandedLinking] = useState<string | null>(null)
    const [selectedLink, setSelectedLink] = useState<Record<string, string>>({})
    const { toast } = useToast()

    const visibleRequests = requests.filter(r => !dismissed.has(r.id))

    if (visibleRequests.length === 0) {
        return null
    }

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessing(prev => ({ ...prev, [requestId]: action }))
        try {
            if (action === 'approve') {
                const linkToId = selectedLink[requestId] || undefined
                const result = await approveCellRequest(requestId, linkToId)
                if (!result.success) {
                    toast({ title: "Erro", description: result.error, variant: 'destructive' })
                    return
                }
                const msg = linkToId
                    ? "Membro aceito e vinculado ao histórico!"
                    : "O membro foi adicionado à célula."
                toast({ title: "Membro Aceito!", description: msg, variant: 'default' })
            } else {
                const result = await rejectCellRequest(requestId)
                if (!result.success) {
                    toast({ title: "Erro", description: result.error, variant: 'destructive' })
                    return
                }
                toast({ title: "Solicitação Rejeitada", description: "A solicitação foi removida.", variant: 'default' })
            }
            setDismissed(prev => new Set(prev).add(requestId))
            setExpandedLinking(null)
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || 'Erro ao processar solicitação',
                variant: 'destructive'
            })
        } finally {
            setProcessing(prev => ({ ...prev, [requestId]: null }))
        }
    }

    const stageLabels: Record<string, string> = {
        VISITOR: 'Visitante',
        REGULAR_VISITOR: 'Visitante Frequente',
        MEMBER: 'Membro',
        GUARDIAN_ANGEL: 'Anjo da Guarda',
        TRAINING_LEADER: 'Líder em Treinamento',
        LEADER: 'Líder',
        PASTOR: 'Pastor',
    }

    return (
        <div className="space-y-3">
            {visibleRequests.map(request => (
                <Card key={request.id} className="bg-card border-border">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-border">
                                    <AvatarImage src={request.profile.photo_url || ''} />
                                    <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-foreground">{request.profile.full_name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Solicitado {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                                    </p>
                                    {request.profile.phone && (
                                        <p className="text-xs text-muted-foreground/70 mt-0.5">{request.profile.phone}</p>
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
                        </div>

                        {/* Linking option */}
                        {nonRealMembers.length > 0 && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedLinking(expandedLinking === request.id ? null : request.id)}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    <span>Vincular com membro existente</span>
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedLinking === request.id ? 'rotate-180' : ''}`} />
                                </button>

                                {expandedLinking === request.id && (
                                    <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Selecione um membro sem conta para transferir o histórico de presença:
                                        </p>
                                        <select
                                            value={selectedLink[request.id] || ''}
                                            onChange={(e) => setSelectedLink(prev => ({
                                                ...prev,
                                                [request.id]: e.target.value
                                            }))}
                                            className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground"
                                        >
                                            <option value="">Nenhum (não vincular)</option>
                                            {nonRealMembers.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.full_name} — {stageLabels[m.member_stage] || m.member_stage}
                                                    {m.phone ? ` (${m.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedLink[request.id] && (
                                            <p className="text-xs text-amber-500">
                                                Ao aceitar, o histórico de presença será transferido e o perfil antigo será desativado.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
