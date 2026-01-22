import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Video, Calendar, Clock, MapPin, Youtube } from 'lucide-react'

export default async function CultosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch upcoming services
  const { data: upcomingServices } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .gte('service_date', new Date().toISOString().split('T')[0])
    .order('service_date', { ascending: true })
    .order('service_time', { ascending: true })

  // Fetch past services (with recordings)
  const { data: pastServices } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .lt('service_date', new Date().toISOString().split('T')[0])
    .not('youtube_url', 'is', null)
    .order('service_date', { ascending: false })
    .limit(6)

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Cultos Online</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Assista nossos cultos ao vivo ou gravados de onde você estiver
          </p>
        </div>

        {/* Upcoming Services */}
        {upcomingServices && upcomingServices.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Próximos Cultos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/cultos/${service.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-xl flex-1">{service.title}</h3>
                    {service.type === 'ONLINE' && (
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                        AO VIVO
                      </span>
                    )}
                    {service.type === 'HIBRIDO' && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        HÍBRIDO
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(service.service_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-primary" />
                      {service.service_time}
                    </div>

                    {service.location && service.type !== 'ONLINE' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="line-clamp-1">{service.location}</span>
                      </div>
                    )}

                    {(service.youtube_url || service.zoom_meeting_id) && (
                      <div className="flex items-center gap-2 text-sm text-primary font-semibold mt-4">
                        <Video className="w-4 h-4" />
                        Assistir Online
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Services (Recordings) */}
        {pastServices && pastServices.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Cultos Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/cultos/${service.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* YouTube Thumbnail */}
                  {service.youtube_url && (
                    <div className="relative h-48 w-full bg-gray-900 flex items-center justify-center">
                      <Youtube className="w-16 h-16 text-white opacity-50" />
                      <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors" />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(service.service_date).toLocaleDateString('pt-BR', {
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

        {/* Empty State */}
        {(!upcomingServices || upcomingServices.length === 0) &&
          (!pastServices || pastServices.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum culto online disponível
              </h3>
              <p className="text-gray-600 mb-6">
                Em breve teremos transmissões ao vivo e gravações disponíveis
              </p>
              {church.youtube_channel_url && (
                <a
                  href={church.youtube_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                  Ver no YouTube
                </a>
              )}
            </div>
          )}
      </div>
    </div>
  )
}
