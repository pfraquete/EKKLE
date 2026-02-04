import { getProfile } from '@/actions/auth'
import { getWhatsAppInstance, getWhatsAppChats } from '@/actions/whatsapp'
import { getAgentConfig } from '@/actions/agent-config'
import { redirect } from 'next/navigation'
import { BulkMessagingForm } from '@/components/whatsapp/bulk-messaging-form'
import { WhatsAppConfig } from '@/components/whatsapp/whatsapp-config'
import { AgentConfigPanel } from '@/components/whatsapp/agent-config'
import { AgentToggle } from '@/components/whatsapp/agent-toggle'
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

    // Fetch real contacts from Evolution API
    let contacts: WhatsAppContact[] = []
    if (instance?.status === 'CONNECTED') {
        const { data: chats } = await getWhatsAppChats()
        contacts = chats || []
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-foreground">Central de Comunicações</h1>
                <p className="text-muted-foreground">
                    Gerencie o contato com sua igreja e realize disparos em massa via WhatsApp.
                </p>
            </div>

            {/* Agent Toggle - Always visible at the top */}
            {instance?.status === 'CONNECTED' && (
                <AgentToggle 
                    initialIsActive={agentConfig?.is_active ?? false}
                    churchName={profile.church_id}
                />
            )}

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
                        contacts={contacts}
                        instanceName={instance?.instance_name || ''}
                        isConnected={instance?.status === 'CONNECTED'}
                        churchId={profile.church_id}
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
