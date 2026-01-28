import { getProfile } from '@/actions/auth'
import { getLiveStream } from '@/actions/live-streams'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Play, Square, Edit } from 'lucide-react'
import { LivePlayer } from '@/components/live/live-player'
import { LiveChat } from '@/components/live/live-chat'
import { LiveStreamControls } from '@/components/live/live-stream-controls'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR') redirect('/dashboard')

  const stream = await getLiveStream(id)
  if (!stream) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/lives"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{stream.title}</h1>
            <p className="text-muted-foreground text-sm">
              Gerenciar transmissao
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {(stream.status === 'SCHEDULED' || stream.status === 'ENDED') && (
            <Link
              href={`/dashboard/lives/${id}/editar`}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
          )}
          <LiveStreamControls streamId={stream.id} status={stream.status} />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2">
          <LivePlayer stream={stream} isPastor={true} />
        </div>

        {/* Chat */}
        <div className="lg:col-span-1 h-[600px]">
          <LiveChat
            streamId={stream.id}
            churchId={stream.church_id}
            chatEnabled={stream.chat_enabled}
            isLive={stream.status === 'LIVE'}
            profile={{
              id: profile.id,
              role: profile.role,
              full_name: profile.full_name,
              photo_url: profile.photo_url || null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
