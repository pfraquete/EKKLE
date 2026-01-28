import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { LivePlayer } from '@/components/live/live-player'
import { LiveChat } from '@/components/live/live-chat'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string; domain: string }>
}

export default async function WatchLivePage({ params }: Props) {
  const { id } = await params
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Get the live stream
  const { data: stream } = await supabase
    .from('live_streams')
    .select(`
      *,
      created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
    `)
    .eq('id', id)
    .eq('church_id', church.id)
    .single()

  if (!stream) {
    notFound()
  }

  // If stream is scheduled and not started, show waiting screen
  const isWaiting = stream.status === 'SCHEDULED'
  const isEnded = stream.status === 'ENDED' || stream.status === 'CANCELLED'

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/membro/lives"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{stream.title}</h1>
          {stream.created_by_profile && (
            <p className="text-muted-foreground text-sm">
              Por {stream.created_by_profile.full_name}
            </p>
          )}
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
              {stream.recording_url && (
                <a
                  href={stream.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Assistir Gravacao
                </a>
              )}
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
            <LivePlayer stream={stream} isPastor={false} />
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
                photo_url: profile.photo_url,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
