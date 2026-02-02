import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { ChatList } from '@/components/chat/chat-list'
import { UserSearch } from '@/components/chat/user-search'
import { getConversations } from '@/actions/direct-messages'

export default async function DashboardMensagensPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const conversations = await getConversations()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground font-medium">Converse com membros da sua igreja</p>
        </div>
        <UserSearch basePath="/dashboard/mensagens" />
      </div>

      <ChatList
        initialConversations={conversations}
        currentUserId={profile.id}
        basePath="/dashboard/mensagens"
      />
    </div>
  )
}
