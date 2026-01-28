import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Radio, Calendar, Users, Play, Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function LivesPage() {
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

  // Get all live streams
  const { data: streams } = await supabase
    .from('live_streams')
    .select(`
      *,
      created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
    `)
    .eq('church_id', church.id)
    .order('created_at', { ascending: false })

  // Separate streams by status
  const liveNow = streams?.filter((s) => s.status === 'LIVE') || []
  const scheduled = streams?.filter((s) => s.status === 'SCHEDULED') || []
  const past = streams?.filter((s) => s.status === 'ENDED') || []

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Transmissoes</h1>
        <p className="text-muted-foreground font-medium mt-1">
          Assista as transmissoes ao vivo da nossa igreja
        </p>
      </div>

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
              Ao Vivo Agora
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveNow.map((stream) => (
              <Link
                key={stream.id}
                href={`/membro/lives/${stream.id}`}
                className="group bg-card border-2 border-red-500/20 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-red-500/40 transition-all duration-300"
              >
                <div className="relative h-48 w-full bg-gradient-to-br from-red-500/20 to-primary/10 flex items-center justify-center">
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      AO VIVO
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-red-500 ml-1" />
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-black text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
                    {stream.title}
                  </h3>
                  {stream.created_by_profile && (
                    <p className="text-muted-foreground text-sm mb-4">
                      Por {stream.created_by_profile.full_name}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{stream.total_views || 0} assistindo</span>
                    </div>
                    <span className="text-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      Assistir Agora <Radio className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
              Proximas Transmissoes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduled.map((stream) => (
              <Link
                key={stream.id}
                href={`/membro/lives/${stream.id}`}
                className="group bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative h-40 w-full bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      AGENDADA
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Radio className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {stream.title}
                  </h3>

                  {stream.scheduled_start && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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

                  <span className="text-primary text-xs font-black uppercase tracking-widest">
                    Ver Detalhes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Streams */}
      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-muted-foreground/30 rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
              Transmissoes Anteriores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.slice(0, 6).map((stream) => (
              <div
                key={stream.id}
                className="bg-card border border-border/50 rounded-3xl overflow-hidden opacity-60"
              >
                <div className="relative h-32 w-full bg-muted flex items-center justify-center">
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-muted-foreground/20 text-muted-foreground px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                      <CheckCircle className="w-3.5 h-3.5" />
                      ENCERRADA
                    </div>
                  </div>
                  <Radio className="w-8 h-8 text-muted-foreground/40" />
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-foreground/70 line-clamp-2">
                    {stream.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(stream.actual_end || stream.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <span>{stream.total_views || 0} visualizacoes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!streams || streams.length === 0) && (
        <div className="text-center py-24 bg-card border border-dashed border-border rounded-4xl">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">
            Nenhuma transmissao disponivel
          </h3>
          <p className="text-muted-foreground font-medium">
            Em breve teremos novas transmissoes ao vivo
          </p>
        </div>
      )}
    </div>
  )
}
