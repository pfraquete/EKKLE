import { getProfile } from '@/actions/auth'
import { getLiveStream } from '@/actions/live-streams'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Camera, Monitor } from 'lucide-react'
import { LivePlayer } from '@/components/live/live-player'
import { LiveChat } from '@/components/live/live-chat'
import { LiveStreamControls } from '@/components/live/live-stream-controls'
import { BrowserBroadcastManager } from '@/components/live/browser-broadcast-manager'

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

  const isBrowserBroadcast = stream.broadcast_type === 'browser' && stream.provider === 'MUX'

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{stream.title}</h1>
              {isBrowserBroadcast && (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Navegador
                </span>
              )}
              {stream.broadcast_type === 'rtmp' && stream.provider === 'MUX' && (
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-xs font-bold rounded-full flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  OBS/RTMP
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isBrowserBroadcast
                ? 'Transmita direto pelo navegador'
                : 'Gerenciar transmissao'}
            </p>
          </div>
        </div>

        {/* Controls - only show for non-browser broadcasts or when not live */}
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
          {/* Only show standard controls for non-browser broadcasts */}
          {!isBrowserBroadcast && (
            <LiveStreamControls streamId={stream.id} status={stream.status} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player / Broadcaster */}
        <div className="lg:col-span-2">
          {isBrowserBroadcast ? (
            <BrowserBroadcastManager
              stream={{
                id: stream.id,
                title: stream.title,
                status: stream.status,
                broadcast_type: stream.broadcast_type,
                livekit_room_name: stream.livekit_room_name,
                mux_playback_id: stream.mux_playback_id,
                provider: stream.provider
              }}
            />
          ) : (
            <LivePlayer stream={stream} isPastor={true} />
          )}
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

      {/* Instructions for RTMP broadcasts */}
      {stream.broadcast_type === 'rtmp' && stream.provider === 'MUX' && stream.status === 'SCHEDULED' && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="font-bold text-purple-500 mb-3 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Como transmitir via OBS
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Abra o OBS Studio ou seu software de transmissao preferido</li>
            <li>2. Va em Configuracoes → Transmissao</li>
            <li>3. Selecione "Personalizado" como servico</li>
            <li>4. Cole a URL do servidor RTMP: <code className="bg-muted px-2 py-0.5 rounded">rtmps://global-live.mux.com:443/app</code></li>
            <li>5. Cole sua chave de transmissao (disponivel nas configuracoes da live)</li>
            <li>6. Clique em "Iniciar transmissao" no OBS</li>
            <li>7. Depois clique em "Iniciar Live" aqui na plataforma</li>
          </ol>
        </div>
      )}
    </div>
  )
}
