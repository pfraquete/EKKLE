import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getFeedSettings, getPendingPosts } from '@/actions/feed'
import { FeedSettingsForm } from '@/components/feed/feed-settings-form'
import { FeedModerationQueue } from '@/components/feed/feed-moderation-queue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FeedSettingsPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')
    if (profile.role !== 'PASTOR') redirect('/feed')

    const [settings, pendingPosts] = await Promise.all([
        getFeedSettings(),
        getPendingPosts(),
    ])

    if (!settings) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Erro ao carregar configurações</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-foreground">Configurações do Feed</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Gerencie as configurações e moderação do feed da igreja
                </p>
            </div>

            <Tabs defaultValue="settings" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                    </TabsTrigger>
                    <TabsTrigger value="moderation" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Moderação
                        {pendingPosts.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                                {pendingPosts.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Configurações do Feed</CardTitle>
                            <CardDescription>
                                Defina quem pode publicar, se posts precisam de aprovação e outras opções
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FeedSettingsForm settings={settings} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="moderation">
                    <FeedModerationQueue posts={pendingPosts} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
