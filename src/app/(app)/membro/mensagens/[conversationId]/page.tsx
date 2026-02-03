import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversation, getConversations, getMessages } from '@/actions/direct-messages'
import { ChatSplitLayout, ChatConversation } from '@/components/chat'

interface ConversationPageProps {
    params: Promise<{
        conversationId: string
    }>
}

export default async function MembroConversationPage({ params }: ConversationPageProps) {
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
        redirect('/membro/mensagens')
    }

    // Fetch conversations for split layout and messages
    const [conversations, messages] = await Promise.all([
        getConversations(),
        getMessages(conversationId)
    ])

    return (
        <ChatSplitLayout
            initialConversations={conversations}
            currentUserId={user.id}
            basePath="/membro/mensagens"
            selectedConversationId={conversationId}
        >
            <ChatConversation
                conversation={conversation}
                initialMessages={messages}
                currentUserId={user.id}
                basePath="/membro/mensagens"
            />
        </ChatSplitLayout>
    )
}
