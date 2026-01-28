import { getProfile } from '@/actions/auth'
import { getLiveStreams } from '@/actions/live-streams'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Radio, Calendar, Users, Play, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LiveStreamActions } from '@/components/live/live-stream-actions'

export const dynamic = 'force-dynamic'

export default async function LivesAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR') redirect('/dashboard')

  const streams = await getLiveStreams()

  const statusConfig = {
    SCHEDULED: {
      label: 'Agendada',
      icon: Clock,
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    LIVE: {
      label: 'Ao Vivo',
      icon: Radio,
      class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    ENDED: {
      label: 'Encerrada',
      icon: CheckCircle,
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
    },
    CANCELLED: {
      label: 'Cancelada',
      icon: XCircle,
      class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
  }

  const providerConfig = {
    MUX: { label: 'Mux (RTMP)', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    YOUTUBE: { label: 'YouTube', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    CUSTOM: { label: 'Personalizado', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400' },
  }

  // Separate live streams from others
  const liveNow = streams.filter((s) => s.status === 'LIVE')
  const scheduled = streams.filter((s) => s.status === 'SCHEDULED')
  const past = streams.filter((s) => s.status === 'ENDED' || s.status === 'CANCELLED')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transmissoes ao Vivo</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas transmissoes ao vivo para a igreja</p>
        </div>
        <Link
          href="/dashboard/lives/novo"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-black uppercase tracking-tighter hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Live
        </Link>
      </div>

      {streams.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma transmissao criada</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando sua primeira transmissao ao vivo
          </p>
          <Link
            href="/dashboard/lives/novo"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Live
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Now */}
          {liveNow.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h2 className="font-bold text-lg">Ao Vivo Agora</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveNow.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    statusConfig={statusConfig}
                    providerConfig={providerConfig}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled */}
          {scheduled.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Agendadas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduled.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    statusConfig={statusConfig}
                    providerConfig={providerConfig}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Streams */}
          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-muted-foreground">Anteriores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    statusConfig={statusConfig}
                    providerConfig={providerConfig}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type StatusConfig = {
  label: string
  icon: typeof Radio
  class: string
}

type ProviderConfig = {
  label: string
  class: string
}

function StreamCard({
  stream,
  statusConfig,
  providerConfig,
}: {
  stream: Awaited<ReturnType<typeof getLiveStreams>>[0]
  statusConfig: Record<string, StatusConfig>
  providerConfig: Record<string, ProviderConfig>
}) {
  const status = statusConfig[stream.status]
  const provider = providerConfig[stream.provider]
  const StatusIcon = status.icon

  return (
    <div className="bg-card rounded-xl shadow-md p-6 border border-border/50 hover:border-border transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-lg flex-1 line-clamp-2">{stream.title}</h3>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${status.class}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        {stream.scheduled_start && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {new Date(stream.scheduled_start).toLocaleDateString('pt-BR')} as{' '}
              {new Date(stream.scheduled_start).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span>{stream.total_views} visualizacoes</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${provider.class}`}>
            {provider.label}
          </span>
          {stream.chat_enabled && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Chat Ativo
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/lives/${stream.id}`}
          className="flex-1 text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
        >
          {stream.status === 'LIVE' ? (
            <>
              <Play className="w-4 h-4" />
              Assistir
            </>
          ) : (
            'Ver Detalhes'
          )}
        </Link>
        <LiveStreamActions streamId={stream.id} status={stream.status} />
      </div>

      {/* Created */}
      <p className="text-[10px] text-muted-foreground mt-3">
        Criada{' '}
        {formatDistanceToNow(new Date(stream.created_at), {
          addSuffix: true,
          locale: ptBR,
        })}
      </p>
    </div>
  )
}
