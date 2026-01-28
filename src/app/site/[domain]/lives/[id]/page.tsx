import { getChurch } from '@/lib/get-church'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, MessageSquare } from 'lucide-react'
import { getPublicLiveStream } from '@/actions/live-streams'
import { PublicLivePlayer } from '@/components/live/public-live-player'
import { PublicLiveChat } from '@/components/live/public-live-chat'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string; domain: string }>
}

export default async function WatchPublicLivePage({ params }: Props) {
  const { id } = await params
  const church = await getChurch()

  if (!church) {
    redirect('/')
  }

  // Get the public live stream
  const stream = await getPublicLiveStream(id, church.id)

  if (!stream) {
    notFound()
  }

  // If stream is scheduled and not started, show waiting screen
  const isWaiting = stream.status === 'SCHEDULED'
  const isEnded = stream.status === 'ENDED' || stream.status === 'CANCELLED'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/lives"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{stream.title}</h1>
            <p className="text-muted-foreground text-sm">
              {church.name}
            </p>
          </div>
        </div>

        {/* Waiting Screen */}
        {isWaiting && (
          <div className="bg-card rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
            <div className="relative bg-gradient-to-br from-primary/20 to-muted aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2">
                  Transmissao Agendada
                </h2>
                {stream.scheduled_start && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>
                      {new Date(stream.scheduled_start).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      as{' '}
                      {new Date(stream.scheduled_start).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <p className="text-muted-foreground/70 mt-4">
                  A transmissao comecara em breve. Aguarde...
                </p>
              </div>
            </div>

            {stream.description && (
              <div className="p-10">
                <p className="text-muted-foreground font-medium leading-[1.8] whitespace-pre-wrap">
                  {stream.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ended Screen */}
        {isEnded && (
          <div className="bg-card rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
            <div className="relative bg-muted aspect-video flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-black text-foreground mb-2">
                  Transmissao Encerrada
                </h2>
                <p className="text-muted-foreground">
                  Esta transmissao ja foi finalizada
                </p>
              </div>
            </div>

            {stream.description && (
              <div className="p-10">
                <p className="text-muted-foreground font-medium leading-[1.8] whitespace-pre-wrap">
                  {stream.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Live Content */}
        {stream.status === 'LIVE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player */}
            <div className="lg:col-span-2">
              <PublicLivePlayer stream={stream} />
            </div>

            {/* Chat (read-only for visitors) */}
            <div className="lg:col-span-1 h-[600px]">
              <PublicLiveChat
                streamId={stream.id}
                churchId={stream.church_id}
                chatEnabled={stream.chat_enabled}
                isLive={stream.status === 'LIVE'}
              />
            </div>
          </div>
        )}

        {/* Info for visitors */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Quer participar do chat e ter acesso a mais conteudos?
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2 border border-primary text-primary rounded-xl font-medium hover:bg-primary/10 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
