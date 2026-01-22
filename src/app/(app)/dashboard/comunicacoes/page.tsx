'use server'

import { getProfile } from '@/actions/auth'
import { getWhatsAppInstance } from '@/actions/whatsapp'
import { redirect } from 'next/navigation'
import { BulkMessagingForm } from '@/components/whatsapp/bulk-messaging-form'
import { WhatsAppConfig } from '@/components/whatsapp/whatsapp-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Settings, Share2 } from 'lucide-react'

export default async function ComunicacoesPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: instance } = await getWhatsAppInstance()

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-foreground">Central de Comunicações</h1>
                <p className="text-muted-foreground">
                    Gerencie o contato com sua igreja e realize disparos em massa via WhatsApp.
                </p>
            </div>

            <Tabs defaultValue="bulk" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl">
                    <TabsTrigger value="bulk" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-2">
                        <Share2 className="h-4 w-4" />
                        Disparo em Massa
                    </TabsTrigger>
                    <TabsTrigger value="config" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-2">
                        <Settings className="h-4 w-4" />
                        Conexão WhatsApp
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bulk" className="mt-0 outline-none">
                    {instance?.status === 'CONNECTED' ? (
                        <BulkMessagingForm />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
                            <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-10 w-10 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">WhatsApp Desconectado</h3>
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
            </Tabs>
        </div>
    )
}
