import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventoPage({ params }: PageProps) {
  const { id } = await params
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .single()

  if (!event) {
    notFound()
  }

  const isUpcoming = new Date(event.start_date) >= new Date()

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para eventos
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Event Image */}
          {event.image_url ? (
            <div className="relative h-96 w-full">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Calendar className="w-32 h-32 text-white opacity-50" />
            </div>
          )}

          {/* Event Details */}
          <div className="p-8">
            {/* Status Badge */}
            {isUpcoming ? (
              <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                Próximo Evento
              </span>
            ) : (
              <span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                Evento Realizado
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold mb-6">{event.title}</h1>

            {/* Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <div className="font-semibold text-sm text-gray-600 mb-1">
                    Data
                  </div>
                  <div className="text-lg">
                    {new Date(event.start_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {event.end_date && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-sm text-gray-600 mb-1">
                      Horário
                    </div>
                    <div className="text-lg">
                      {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.end_date && (
                        <>
                          {' - '}
                          {new Date(event.end_date).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-sm text-gray-600 mb-1">
                      Local
                    </div>
                    <div className="text-lg">{event.location}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">Sobre o Evento</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* CTA */}
            {isUpcoming && (
              <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-bold text-xl mb-2">Participe deste evento!</h3>
                <p className="text-gray-600 mb-4">
                  Entre em contato conosco para mais informações ou para confirmar sua presença.
                </p>
                <div className="flex flex-wrap gap-4">
                  {church.whatsapp_url && (
                    <a
                      href={church.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Entrar em Contato
                    </a>
                  )}
                  <Link
                    href="/membro"
                    className="bg-white border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Criar Conta
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
