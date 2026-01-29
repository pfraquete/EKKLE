import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock } from 'lucide-react'

export default async function EventosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch all published events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })

  const { data: pastEvents } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .lt('start_date', new Date().toISOString())
    .order('start_date', { ascending: false })
    .limit(6)

  return (
    <div className="py-12 sm:py-24 bg-background animate-in fade-in duration-700">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-12 sm:mb-20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Agenda</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tighter italic">Nossa Casa</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl font-medium tracking-tight">
            Participe dos nossos eventos, cursos e atividades para fortalecer sua caminhada em comunidade.
          </p>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Próximos Eventos</h2>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="group bg-card border border-border/40 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-muted-foreground/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="p-6 sm:p-10">
                    <h3 className="font-black text-xl sm:text-2xl mb-4 sm:mb-5 text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">{event.title}</h3>

                    <div className="space-y-3 sm:space-y-4 mb-4">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-border/50 flex justify-end">
                      <span className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                        Ver Detalhes →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-[3rem] mb-24">
            <Calendar className="w-20 h-20 mx-auto mb-6 text-muted-foreground/10" />
            <h3 className="text-2xl font-black text-foreground mb-2">Sem eventos no momento</h3>
            <p className="text-muted-foreground font-medium">
              Acompanhe nossas atualizações para novas programações em breve.
            </p>
          </div>
        )}

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-10 opacity-50">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Eventos Anteriores</h2>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="group bg-card/40 border border-border/20 rounded-[2rem] overflow-hidden hover:bg-card transition-all duration-300 opacity-60 hover:opacity-100"
                >
                  <div className="relative h-40 w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-muted-foreground/10" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground line-clamp-1">{event.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.start_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
