import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Radio, Calendar, Users, Play, Clock } from 'lucide-react'
import { getPublicLiveStreams } from '@/actions/live-streams'

export const dynamic = 'force-dynamic'

export default async function PublicLivesPage() {
  const church = await getChurch()

  if (!church) {
    redirect('/')
  }

  // Get public live streams
  const streams = await getPublicLiveStreams(church.id)

  // Separate streams by status
  const liveNow = streams.filter((s) => s.status === 'LIVE')
  const scheduled = streams.filter((s) => s.status === 'SCHEDULED')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Transmissoes ao Vivo
          </h1>
          <p className="text-muted-foreground font-medium mt-2">
            Assista as transmissoes da {church.name}
          </p>
        </div>

        {/* Live Now */}
        {liveNow.length > 0 && (
          <section>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                Ao Vivo Agora
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {liveNow.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/lives/${stream.id}`}
                  className="group bg-card border-2 border-red-500/20 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-red-500/40 transition-all duration-300"
                >
                  <div className="relative h-56 w-full bg-gradient-to-br from-red-500/20 to-primary/10 flex items-center justify-center">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        AO VIVO
                      </div>
                    </div>
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-12 h-12 text-red-500 ml-1" />
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="font-black text-2xl mb-2 text-foreground group-hover:text-primary transition-colors">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {stream.description}
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
            <div className="flex items-center justify-center gap-3 mb-8">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                Proximas Transmissoes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {scheduled.map((stream) => (
                <div
                  key={stream.id}
                  className="bg-card border border-border/50 rounded-3xl overflow-hidden"
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
                    <h3 className="font-bold text-lg mb-3 text-foreground line-clamp-2">
                      {stream.title}
                    </h3>

                    {stream.scheduled_start && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {new Date(stream.scheduled_start).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          as{' '}
                          {new Date(stream.scheduled_start).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {streams.length === 0 && (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-3xl max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Radio className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              Nenhuma transmissao disponivel
            </h3>
            <p className="text-muted-foreground font-medium">
              Volte em breve para assistir nossas transmissoes ao vivo
            </p>
          </div>
        )}

        {/* CTA for members */}
        <div className="text-center pt-8">
          <p className="text-muted-foreground mb-4">
            Faca parte da nossa comunidade para ter acesso a conteudos exclusivos
          </p>
          <Link
            href="/registro"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Cadastre-se Gratuitamente
          </Link>
        </div>
      </div>
    </div>
  )
}
