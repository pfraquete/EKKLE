'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, RefreshCw, LogOut, CheckCircle2, Loader2, Settings2 } from 'lucide-react'
import { setupWhatsApp, disconnectWhatsApp, checkWhatsAppStatus } from '@/actions/whatsapp'
import { toast } from 'sonner'
import Link from 'next/link'

interface WhatsAppInstance {
    instance_name: string
    status: string
    qr_code?: string
    last_ping?: string
}

interface WhatsAppConfigProps {
    initialInstance: WhatsAppInstance | null
}

export function WhatsAppConfig({ initialInstance }: WhatsAppConfigProps) {
    const [instance, setInstance] = useState<WhatsAppInstance | null>(initialInstance)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (instance?.status === 'CONNECTING' || instance?.status === 'DISCONNECTED') {
            interval = setInterval(async () => {
                const status = await checkWhatsAppStatus(instance.instance_name)
                if (status === 'CONNECTED') {
                    setInstance((prev) => prev ? ({ ...prev, status: 'CONNECTED' }) : null)
                    toast.success('WhatsApp conectado com sucesso!')
                    clearInterval(interval)
                }
            }, 5000)
        }

        return () => clearInterval(interval)
    }, [instance?.status, instance?.instance_name])

    const handleSetup = async () => {
        setLoading(true)
        try {
            console.log('[WhatsAppConfig] Iniciando setup...')
            const result = await setupWhatsApp()
            console.log('[WhatsAppConfig] Resultado do setup:', result)
            
            if (result && !result.success) {
                console.error('[WhatsAppConfig] Setup falhou:', result.error)
                toast.error(result.error || 'Erro ao configurar WhatsApp')
                return
            }
            
            // Atualizar estado local ao invés de reload
            if (result && result.instance) {
                console.log('[WhatsAppConfig] Atualizando estado com instância:', result.instance)
                console.log('[WhatsAppConfig] QR Code presente?', !!result.instance.qr_code)
                setInstance(result.instance)
                toast.success('QR Code gerado! Escaneie para conectar.')
            } else {
                console.warn('[WhatsAppConfig] Resultado não contém instância')
                toast.error('Erro: resposta sem dados da instância')
            }
        } catch (err: any) {
            console.error('[WhatsAppConfig] Erro no setup:', err)
            toast.error(err.message || 'Erro ao configurar WhatsApp')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!instance) return
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return
        setLoading(true)
        try {
            await disconnectWhatsApp(instance.instance_name)
            setInstance(null)
            toast.success('WhatsApp desconectado')
        } catch (err) {
            console.error('Disconnect error:', err)
            toast.error('Erro ao desconectar')
        } finally {
            setLoading(false)
        }
    }

    const handleCheckStatus = async () => {
        if (!instance) return
        setChecking(true)
        try {
            const status = await checkWhatsAppStatus(instance.instance_name)
            setInstance((prev) => prev ? ({ ...prev, status }) : null)
            if (status === 'CONNECTED') toast.success('WhatsApp está conectado')
            else toast.info('WhatsApp ainda não está conectado')
        } catch (err) {
            console.error('Check status error:', err)
            toast.error('Erro ao verificar status')
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="grid gap-6">
            <Card className="border-none shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-green-500" />
                                Status da Conexão
                            </CardTitle>
                            <CardDescription>
                                Veja se a sua igreja está conectada à Evolution API.
                            </CardDescription>
                        </div>
                        {instance && (
                            <Badge
                                variant={instance.status === 'CONNECTED' ? 'default' : 'secondary'}
                                className={instance.status === 'CONNECTED' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500/10 text-amber-500'}
                            >
                                {instance.status === 'CONNECTED' ? 'Conectado' : 'Aguardando Conexão'}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!instance ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-10 w-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">Nenhum WhatsApp conectado</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Conecte o WhatsApp da sua igreja para começar a enviar lembretes automáticos e mensagens para os membros.
                                </p>
                            </div>
                            <Button onClick={handleSetup} disabled={loading} className="font-bold">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Gerar QR Code de Conexão
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-2xl border border-green-500/10 mb-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-green-700">Automações Ativas</p>
                                    <p className="text-[10px] text-green-600/70">As mensagens automáticas estão configuradas.</p>
                                </div>
                                <Link href="/configuracoes/whatsapp/templates">
                                    <Button variant="outline" size="sm" className="bg-white hover:bg-green-50 border-green-200 text-green-600 font-bold h-8">
                                        <Settings2 className="h-3.5 w-3.5 mr-2" />
                                        Personalizar Mensagens
                                    </Button>
                                </Link>
                            </div>

                            {instance.status !== 'CONNECTED' && instance.qr_code && (
                                <div className="flex flex-col items-center space-y-4 p-6 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
                                    <div className="bg-white p-4 rounded-xl shadow-inner">
                                        <Image
                                            src={instance.qr_code}
                                            alt="WhatsApp QR Code"
                                            width={256}
                                            height={256}
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="font-bold">Escaneie o QR Code</p>
                                        <p className="text-sm text-muted-foreground">
                                            Abra o WhatsApp no seu celular {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleSetup} disabled={loading}>
                                        <RefreshCw className={`mr-2 h-4 w-4 ${loading && 'animate-spin'}`} />
                                        Atualizar QR Code
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Nome da Instância</p>
                                    <p className="font-mono text-sm bg-muted p-2 rounded">{instance.instance_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Última Verificação</p>
                                    <p className="text-sm">
                                        {isMounted && instance.last_ping ? new Date(instance.last_ping).toLocaleString('pt-BR') : 'Nunca verificada'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold"
                                    onClick={handleCheckStatus}
                                    disabled={checking}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${checking && 'animate-spin'}`} />
                                    Verificar Conexão
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 font-bold"
                                    onClick={handleDisconnect}
                                    disabled={loading}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Desconectar
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        O que você pode fazer com o WhatsApp?
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Automação</Badge>
                        <p className="text-sm font-medium">Lembretes automáticos para reuniões de célula e cultos.</p>
                    </div>
                    <div className="space-y-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Engajamento</Badge>
                        <p className="text-sm font-medium">Mensagens de boas-vindas automáticas para novos visitantes.</p>
                    </div>
                    <div className="space-y-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Retenção</Badge>
                        <p className="text-sm font-medium">Notificações de aniversário e datas especiais.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
