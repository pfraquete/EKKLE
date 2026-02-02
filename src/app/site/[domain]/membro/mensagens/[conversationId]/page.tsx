import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversation, getMessages } from '@/actions/direct-messages'
import { ChatConversation } from '@/components/chat'

interface ConversationPageProps {
    params: Promise<{
        domain: string
        conversationId: string
    }>
}

export default async function SiteConversationPage({ params }: ConversationPageProps) {
    const { domain, conversationId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/site/${domain}/login`)
    }

    const conversation = await getConversation(conversationId)

    if (!conversation) {
        notFound()
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
        p => p.profile_id === user.id
    )

    if (!isParticipant) {
        redirect(`/site/${domain}/membro/mensagens`)
    }

    const messages = await getMessages(conversationId)

    return (
        <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
            <ChatConversation
                conversation={conversation}
                initialMessages={messages}
                currentUserId={user.id}
                basePath={`/site/${domain}/membro/mensagens`}
            />
        </div>
    )
}
