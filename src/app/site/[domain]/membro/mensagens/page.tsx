import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/actions/direct-messages'
import { ChatList } from '@/components/chat'

interface MensagensPageProps {
    params: Promise<{
        domain: string
    }>
}

export default async function SiteMensagensPage({ params }: MensagensPageProps) {
    const { domain } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/site/${domain}/login`)
    }

    const conversations = await getConversations()

    return (
        <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
            <ChatList
                initialConversations={conversations}
                currentUserId={user.id}
                basePath="/membro/mensagens"
            />
        </div>
    )
}
