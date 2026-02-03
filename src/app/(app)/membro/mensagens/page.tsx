import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/actions/direct-messages'
import { ChatSplitLayout } from '@/components/chat'

export default async function MembroMensagensPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const conversations = await getConversations()

    return (
        <ChatSplitLayout
            initialConversations={conversations}
            currentUserId={user.id}
            basePath="/membro/mensagens"
        />
    )
}
