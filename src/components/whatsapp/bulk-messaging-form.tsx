'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
    Users,
    Send,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Loader2,
    UserPlus,
    UserCheck,
    MessageSquare
} from 'lucide-react'
import { getMessagingTargets, sendBulkWhatsAppMessage, type MessagingTarget } from '@/actions/whatsapp-bulk'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function BulkMessagingForm() {
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [targets, setTargets] = useState<MessagingTarget[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [message, setMessage] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [stageFilter, setStageFilter] = useState('')

    // Progress state
    const [progress, setProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0 })


    const loadTargets = useCallback(async () => {
        setLoading(true)
        const result = await getMessagingTargets({
            role: roleFilter || undefined,
            member_stage: stageFilter || undefined,
            search: search || undefined
        })
        if (result.success && result.data) {
            setTargets(result.data)
        }
        setLoading(false)
    }, [roleFilter, stageFilter, search])

    useEffect(() => {
        loadTargets()
    }, [loadTargets])

    const toggleSelectAll = () => {
        if (selectedIds.size === targets.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(targets.map(t => t.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const handleSend = async () => {
        if (selectedIds.size === 0) {
            toast.error('Selecione pelo menos um destinatário')
            return
        }
        if (!message.trim()) {
            toast.error('Escreva uma mensagem')
            return
        }

        const selectedTargets = targets.filter(t => selectedIds.has(t.id))

        if (!confirm(`Deseja enviar esta mensagem para ${selectedTargets.length} pessoas?`)) return

        setSending(true)
        setProgress({ current: 0, total: selectedTargets.length, sent: 0, failed: 0 })

        const result = await sendBulkWhatsAppMessage(message, selectedTargets)

        if (result.success && result.results) {
            toast.success(`Disparo concluído: ${result.results.sent} enviados, ${result.results.failed} falhas.`)
            setSelectedIds(new Set())
            setMessage('')
        } else {
            toast.error(result.error || 'Erro ao realizar disparo')
        }
        setSending(false)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Step 1: Target Selection */}
            <Card className="border-none shadow-xl flex flex-col h-[650px]">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Público-Alvo
                    </CardTitle>
                    <CardDescription>
                        Selecione quem receberá a mensagem.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por nome..."
                                className="pl-9 rounded-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadTargets()}
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">Todos os Cargos</option>
                                <option value="PASTOR">Pastor</option>
                                <option value="LEADER">Líder</option>
                                <option value="MEMBER">Membro</option>
                            </select>
                            <select
                                className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                value={stageFilter}
                                onChange={(e) => setStageFilter(e.target.value)}
                            >
                                <option value="">Todos os Estágios</option>
                                <option value="VISITOR">Visitante</option>
                                <option value="MEMBER">Membro Efetivo</option>
                                <option value="LEADER">Líder treinado</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">
                            {selectedIds.size} selecionados de {targets.length}
                        </span>
                        <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8 text-xs font-bold text-primary">
                            {selectedIds.size === targets.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : targets.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground text-sm">
                                Nenhum membro encontrado com os filtros selecionados.
                            </div>
                        ) : (
                            targets.map((target) => (
                                <div
                                    key={target.id}
                                    onClick={() => toggleSelect(target.id)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                                        selectedIds.has(target.id)
                                            ? "bg-primary/5 border-primary/20"
                                            : "hover:bg-muted border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold",
                                            selectedIds.has(target.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                            {target.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none">{target.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{target.phone}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
                                        {target.role}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Message Composition */}
            <div className="space-y-6">
                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Mensagem
                        </CardTitle>
                        <CardDescription>
                            Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> para personalizar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Conteúdo da Mensagem</Label>
                            <Textarea
                                id="message"
                                placeholder="Olá {{nome}}! Queremos te convidar para o culto especial deste domingo..."
                                className="min-h-[200px] rounded-2xl resize-none p-4"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <div className="p-4 bg-muted/50 rounded-2xl space-y-2 border border-dashed text-xs text-muted-foreground">
                            <p className="font-bold flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Dicas de Envio:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Envios em massa podem causar bloqueios se exagerados.</li>
                                <li>O sistema adiciona um atraso de 1.5s entre cada mensagem.</li>
                                <li>Certifique-se de que o WhatsApp está conectado.</li>
                            </ul>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl font-bold text-lg"
                            disabled={sending || selectedIds.size === 0 || !message.trim()}
                            onClick={handleSend}
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Enviando ({progress.current}/{progress.total})...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Iniciar Disparo para {selectedIds.size} Contatos
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {sending && (
                    <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span>Status do Disparo</span>
                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-primary-foreground/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-foreground transition-all duration-500"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-white/10 p-3 rounded-xl">
                                        <p className="text-2xl font-black">{progress.sent}</p>
                                        <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Enviados</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-xl">
                                        <p className="text-2xl font-black text-rose-200">{progress.failed}</p>
                                        <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Falhas</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
