import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowLeft, Video, Copy } from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export default async function CultoPage({ params }: PageProps) {
  const { id } = await params
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch service
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .single()

  if (!service) {
    notFound()
  }

  const isUpcoming = new Date(service.service_date) >= new Date()
  const youtubeVideoId = service.youtube_url
    ? extractYouTubeVideoId(service.youtube_url)
    : null

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/cultos"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para cultos
        </Link>

        <div className="max-w-5xl mx-auto">
          {/* Service Video */}
          {youtubeVideoId && (
            <div className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title={service.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-4">
              <div>
                {isUpcoming ? (
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                    Próximo Culto
                  </span>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                    Culto Realizado
                  </span>
                )}
              </div>

              {service.type === 'ONLINE' && (
                <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                  ONLINE
                </span>
              )}
              {service.type === 'HIBRIDO' && (
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  HÍBRIDO
                </span>
              )}
              {service.type === 'PRESENCIAL' && (
                <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                  PRESENCIAL
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-6">{service.title}</h1>

            {/* Service Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <div className="font-semibold text-sm text-gray-600 mb-1">Data</div>
                  <div className="text-lg">
                    {new Date(service.service_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <div className="font-semibold text-sm text-gray-600 mb-1">
                    Horário
                  </div>
                  <div className="text-lg">{service.service_time}</div>
                </div>
              </div>

              {service.location && service.type !== 'ONLINE' && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-sm text-gray-600 mb-1">
                      Local
                    </div>
                    <div className="text-lg">{service.location}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {service.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Sobre o Culto</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {service.description}
                </p>
              </div>
            )}

            {/* Zoom Access */}
            {service.zoom_meeting_id && isUpcoming && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <Video className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">Assistir via Zoom</h3>
                    <p className="text-gray-600 mb-4">
                      Participe do culto ao vivo através do Zoom
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      ID da Reunião
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-lg font-mono">
                        {service.zoom_meeting_id}
                      </code>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(service.zoom_meeting_id)
                        }
                        className="p-2 hover:bg-white rounded transition-colors"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {service.zoom_password && (
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">
                        Senha
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white px-3 py-2 rounded border text-lg font-mono">
                          {service.zoom_password}
                        </code>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(service.zoom_password)
                          }
                          className="p-2 hover:bg-white rounded transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <a
                    href={`https://zoom.us/j/${service.zoom_meeting_id}${
                      service.zoom_password ? `?pwd=${service.zoom_password}` : ''
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-4"
                  >
                    Entrar no Zoom
                  </a>
                </div>
              </div>
            )}

            {/* YouTube Link (if not embedded) */}
            {service.youtube_url && !youtubeVideoId && (
              <div className="mt-8">
                <a
                  href={service.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  <Video className="w-5 h-5" />
                  Assistir no YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
