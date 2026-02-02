import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import { getConversation, getMessages } from '@/actions/direct-messages'
import { ChatConversation } from '@/components/chat/chat-conversation'

type PageProps = {
  params: Promise<{ conversationId: string }>
}

export default async function DashboardConversationPage({ params }: PageProps) {
  const { conversationId } = await params
  const profile = await getProfile()

  if (!profile) redirect('/login')

  const conversation = await getConversation(conversationId)
  if (!conversation) notFound()

  const messages = await getMessages(conversationId)

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ChatConversation
        conversation={conversation}
        initialMessages={messages}
        currentUserId={profile.id}
        basePath="/dashboard/mensagens"
      />
    </div>
  )
}
