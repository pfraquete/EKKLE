import { getProfile } from '@/actions/auth'
import { getWhatsAppInstance } from '@/actions/whatsapp'
import { getAgentConfig } from '@/actions/agent-config'
import { redirect } from 'next/navigation'
import { BulkMessagingForm } from '@/components/whatsapp/bulk-messaging-form'
import { WhatsAppConfig } from '@/components/whatsapp/whatsapp-config'
import { AgentConfigPanel } from '@/components/whatsapp/agent-config'
import { WhatsAppChatLayout, WhatsAppContact } from '@/components/whatsapp-chat'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Settings, Share2, Bot, MessagesSquare } from 'lucide-react'

export default async function ComunicacoesPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: instance } = await getWhatsAppInstance()
    const agentConfig = await getAgentConfig()

    // Mock contacts for demonstration - in production, fetch from Evolution API
    const mockContacts: WhatsAppContact[] = instance?.status === 'CONNECTED' ? [
        {
            id: '1',
            name: 'Maria Silva',
            phone: '+55 11 99999-1234',
            last_message: 'Obrigada pela informação!',
            last_message_time: new Date(Date.now() - 300000).toISOString(),
            unread_count: 2,
            is_online: true
        },
        {
            id: '2',
            name: 'João Santos',
            phone: '+55 11 98888-5678',
            last_message: 'Qual horário do culto?',
            last_message_time: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0,
            is_online: false
        },
        {
            id: '3',
            name: 'Ana Oliveira',
            phone: '+55 11 97777-9012',
            last_message: 'Vou participar da célula amanhã',
            last_message_time: new Date(Date.now() - 7200000).toISOString(),
            unread_count: 5,
            is_online: true
        },
        {
            id: '4',
            name: 'Pedro Costa',
            phone: '+55 11 96666-3456',
            last_message: 'Amém! Deus abençoe',
            last_message_time: new Date(Date.now() - 86400000).toISOString(),
            unread_count: 0,
            is_online: false
        },
        {
            id: '5',
            name: 'Carla Mendes',
            phone: '+55 11 95555-7890',
            last_message: 'Preciso conversar com o pastor',
            last_message_time: new Date(Date.now() - 172800000).toISOString(),
            unread_count: 1,
            is_online: false
        },
    ] : []

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-foreground">Central de Comunicações</h1>
                <p className="text-muted-foreground">
                    Gerencie o contato com sua igreja e realize disparos em massa via WhatsApp.
                </p>
            </div>

            <Tabs defaultValue="conversations" className="space-y-6">
                <TabsList className="h-12 rounded-2xl border border-border bg-muted/40 p-1">
                    <TabsTrigger
                        value="conversations"
                        className="h-full gap-2 rounded-xl px-6 py-2 font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <MessagesSquare className="h-4 w-4" />
                        Conversas
                    </TabsTrigger>
                    <TabsTrigger
                        value="bulk"
                        className="h-full gap-2 rounded-xl px-6 py-2 font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Share2 className="h-4 w-4" />
                        Disparo em Massa
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="h-full gap-2 rounded-xl px-6 py-2 font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Settings className="h-4 w-4" />
                        Conexão WhatsApp
                    </TabsTrigger>
                    <TabsTrigger
                        value="agent"
                        className="h-full gap-2 rounded-xl px-6 py-2 font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        <Bot className="h-4 w-4" />
                        Agente IA
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="conversations" className="mt-0 outline-none">
                    <WhatsAppChatLayout
                        contacts={mockContacts}
                        instanceName={instance?.instance_name || ''}
                        isConnected={instance?.status === 'CONNECTED'}
                    />
                </TabsContent>

                <TabsContent value="bulk" className="mt-0 outline-none">
                    {instance?.status === 'CONNECTED' ? (
                        <BulkMessagingForm />
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed border-border bg-muted/20 py-20 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                <MessageSquare className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">WhatsApp Desconectado</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Para realizar disparos em massa, você precisa primeiro conectar seu número na aba <b>Conexão WhatsApp</b>.
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="config" className="mt-0 outline-none">
                    <WhatsAppConfig initialInstance={instance} />
                </TabsContent>

                <TabsContent value="agent" className="mt-0 outline-none">
                    <AgentConfigPanel initialConfig={agentConfig} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
