'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Heart,
    Plus,
    Sparkles,
    CheckCircle2,
    Trash2,
    X,
    HandHeart,
    MessageCircleHeart
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
    CellPrayerRequest,
    createPrayerRequest,
    togglePrayerSupport,
    markPrayerAsAnswered,
    deletePrayerRequest
} from '@/actions/cell-prayer'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface PrayerWallProps {
    cellId: string
    initialRequests: CellPrayerRequest[]
    currentUserId: string
}

export function PrayerWall({ cellId, initialRequests, currentUserId }: PrayerWallProps) {
    const [requests, setRequests] = useState<CellPrayerRequest[]>(initialRequests)
    const [isCreating, setIsCreating] = useState(false)
    const [newRequest, setNewRequest] = useState('')
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [testimonyDialogOpen, setTestimonyDialogOpen] = useState<string | null>(null)
    const [testimony, setTestimony] = useState('')

    const handleCreateRequest = () => {
        if (!newRequest.trim()) {
            toast.error('Digite seu pedido de oração')
            return
        }

        startTransition(async () => {
            const result = await createPrayerRequest(cellId, newRequest.trim(), isAnonymous)
            if (result.success) {
                toast.success('Pedido de oração enviado! 🙏')
                setNewRequest('')
                setIsAnonymous(false)
                setIsCreating(false)
                // Refresh will happen via revalidatePath
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao enviar pedido')
            }
        })
    }

    const handleToggleSupport = (requestId: string) => {
        startTransition(async () => {
            const result = await togglePrayerSupport(requestId)
            if (result.success) {
                setRequests(prev => prev.map(r => {
                    if (r.id === requestId) {
                        return {
                            ...r,
                            user_is_supporting: result.isSupporting!,
                            supporters_count: result.isSupporting 
                                ? r.supporters_count + 1 
                                : r.supporters_count - 1
                        }
                    }
                    return r
                }))
                toast.success(result.isSupporting ? 'Você está orando por este pedido! 🙏' : 'Apoio removido')
            } else {
                toast.error(result.error || 'Erro ao atualizar apoio')
            }
        })
    }

    const handleMarkAsAnswered = (requestId: string) => {
        startTransition(async () => {
            const result = await markPrayerAsAnswered(requestId, testimony || undefined)
            if (result.success) {
                toast.success('Glória a Deus! Oração respondida! 🎉')
                setTestimonyDialogOpen(null)
                setTestimony('')
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao marcar como respondida')
            }
        })
    }

    const handleDelete = (requestId: string) => {
        if (!confirm('Tem certeza que deseja excluir este pedido?')) return

        startTransition(async () => {
            const result = await deletePrayerRequest(requestId)
            if (result.success) {
                setRequests(prev => prev.filter(r => r.id !== requestId))
                toast.success('Pedido excluído')
            } else {
                toast.error(result.error || 'Erro ao excluir')
            }
        })
    }

    const activeRequests = requests.filter(r => r.status === 'active')
    const answeredRequests = requests.filter(r => r.status === 'answered')

    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 lg:p-4 bg-primary/10 rounded-xl sm:rounded-2xl">
                            <HandHeart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter italic uppercase">
                                Mural de Oração
                            </h3>
                            <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest">
                                Ore pelos irmãos da sua célula
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsCreating(true)}
                        size="sm"
                        className="rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Pedir Oração
                    </Button>
                </div>
            </div>

            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4">
                {/* Create new request form */}
                {isCreating && (
                    <div className="bg-muted/30 border border-border/40 rounded-xl sm:rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <Textarea
                            placeholder="Compartilhe seu pedido de oração..."
                            value={newRequest}
                            onChange={(e) => setNewRequest(e.target.value)}
                            className="min-h-[100px] resize-none rounded-xl"
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <Checkbox
                                    checked={isAnonymous}
                                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                                />
                                Enviar anonimamente
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreating(false)
                                        setNewRequest('')
                                        setIsAnonymous(false)
                                    }}
                                    className="rounded-xl"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleCreateRequest}
                                    disabled={isPending || !newRequest.trim()}
                                    className="rounded-xl font-bold"
                                >
                                    {isPending ? 'Enviando...' : 'Enviar Pedido'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active prayer requests */}
                {activeRequests.length === 0 && !isCreating ? (
                    <div className="text-center py-8 sm:py-12 lg:py-16 bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-dashed border-border/60">
                        <HandHeart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-xs sm:text-sm text-muted-foreground font-black uppercase tracking-wider sm:tracking-[0.2em] italic">
                            Nenhum pedido de oração no momento
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                            Seja o primeiro a compartilhar um pedido!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {activeRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-muted/30 border border-border/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {request.is_anonymous ? (
                                            <Avatar className="h-10 w-10 border-2 border-border">
                                                <AvatarFallback className="bg-muted text-muted-foreground">
                                                    ?
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <Avatar className="h-10 w-10 border-2 border-border">
                                                <AvatarImage src={request.author?.photo_url || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {request.author?.full_name?.[0] || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div>
                                            <p className="font-bold text-foreground text-sm">
                                                {request.is_anonymous ? 'Anônimo' : request.author?.full_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(request.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {request.author_id === currentUserId && (
                                        <div className="flex gap-1">
                                            <Dialog open={testimonyDialogOpen === request.id} onOpenChange={(open) => {
                                                if (!open) {
                                                    setTestimonyDialogOpen(null)
                                                    setTestimony('')
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                        onClick={() => setTestimonyDialogOpen(request.id)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Oração Respondida! 🎉</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 pt-4">
                                                        <Textarea
                                                            placeholder="Compartilhe seu testemunho (opcional)..."
                                                            value={testimony}
                                                            onChange={(e) => setTestimony(e.target.value)}
                                                            className="min-h-[100px]"
                                                        />
                                                        <Button
                                                            onClick={() => handleMarkAsAnswered(request.id)}
                                                            disabled={isPending}
                                                            className="w-full"
                                                        >
                                                            {isPending ? 'Salvando...' : 'Marcar como Respondida'}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(request.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {request.request}
                                </p>

                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                    <Button
                                        variant={request.user_is_supporting ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleToggleSupport(request.id)}
                                        disabled={isPending}
                                        className={`rounded-xl font-bold text-xs ${
                                            request.user_is_supporting 
                                                ? 'bg-primary/90 hover:bg-primary' 
                                                : ''
                                        }`}
                                    >
                                        <Heart className={`h-4 w-4 mr-1.5 ${request.user_is_supporting ? 'fill-current' : ''}`} />
                                        {request.user_is_supporting ? 'Orando' : 'Orar'}
                                    </Button>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {request.supporters_count} {request.supporters_count === 1 ? 'pessoa orando' : 'pessoas orando'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Answered prayers section */}
                {answeredRequests.length > 0 && (
                    <div className="pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                                Orações Respondidas
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {answeredRequests.slice(0, 3).map((request) => (
                                <div
                                    key={request.id}
                                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Respondida
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {request.is_anonymous ? 'Anônimo' : request.author?.full_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80">{request.request}</p>
                                    {request.testimony && (
                                        <div className="bg-emerald-500/10 rounded-lg p-3 mt-2">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <MessageCircleHeart className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-600 uppercase">Testemunho</span>
                                            </div>
                                            <p className="text-sm text-foreground/90 italic">"{request.testimony}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
