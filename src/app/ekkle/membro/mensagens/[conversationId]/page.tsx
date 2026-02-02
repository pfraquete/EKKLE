import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversation, getMessages } from '@/actions/direct-messages'
import { ChatConversation } from '@/components/chat'

interface ConversationPageProps {
    params: Promise<{
        conversationId: string
    }>
}

export default async function EkkleConversationPage({ params }: ConversationPageProps) {
    const { conversationId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
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
        redirect('/ekkle/membro/mensagens')
    }

    const messages = await getMessages(conversationId)

    return (
        <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-2xl border border-border/50 overflow-hidden">
            <ChatConversation
                conversation={conversation}
                initialMessages={messages}
                currentUserId={user.id}
                basePath="/ekkle/membro/mensagens"
            />
        </div>
    )
}
