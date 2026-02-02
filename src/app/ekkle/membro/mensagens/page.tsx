import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/actions/direct-messages'
import { ChatList } from '@/components/chat'

export default async function EkkleMensagensPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const conversations = await getConversations()

    return (
        <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
            <ChatList
                initialConversations={conversations}
                currentUserId={user.id}
                basePath="/ekkle/membro/mensagens"
            />
        </div>
    )
}
