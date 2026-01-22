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
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Nossos Eventos</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Participe dos nossos eventos e faça parte da nossa comunidade
          </p>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Próximos Eventos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {event.image_url ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      {event.end_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg mb-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Nenhum evento próximo</h3>
            <p className="text-gray-600">
              Fique atento às nossas redes sociais para novos eventos
            </p>
          </div>
        )}

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Eventos Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow opacity-75"
                >
                  {event.image_url ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover grayscale"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
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
