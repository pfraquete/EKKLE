import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ChevronLeft, Users, DollarSign, ExternalLink, Video } from 'lucide-react'
import { EventRegistrationButton } from '@/components/events/event-registration-button'
import { getMyEventRegistration, getEventRegistrationCount } from '@/actions/event-registrations'
import { Button } from '@/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventoDetalhePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  
  if (!profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .eq('is_published', true)
    .single()

  if (!event) {
    notFound()
  }

  const isUpcoming = new Date(event.start_date) >= new Date()

  // Get existing registration
  const { registration: existingRegistration } = await getMyEventRegistration(id)

  // Get registration count and calculate capacity
  const { count: registrationCount } = await getEventRegistrationCount(id)
  const spotsLeft = event.capacity ? event.capacity - registrationCount : null
  const isFull = event.capacity ? registrationCount >= event.capacity : false

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/membro/eventos">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Detalhes do Evento</h1>
          <p className="text-muted-foreground font-medium">Confira as informações e inscreva-se</p>
        </div>
      </div>

      {/* Event Card */}
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xl">
        {/* Event Image */}
        {event.image_url ? (
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              {isUpcoming ? (
                <span className="inline-block bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                  Próximo Evento
                </span>
              ) : (
                <span className="inline-block bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                  Evento Realizado
                </span>
              )}
              <h2 className="text-3xl font-black text-white">{event.title}</h2>
            </div>
          </div>
        ) : (
          <div className="h-64 md:h-80 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
            <Calendar className="w-24 h-24 text-primary/30" />
            <div className="absolute bottom-6 left-6 right-6">
              {isUpcoming ? (
                <span className="inline-block bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                  Próximo Evento
                </span>
              ) : (
                <span className="inline-block bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                  Evento Realizado
                </span>
              )}
              <h2 className="text-3xl font-black text-foreground">{event.title}</h2>
            </div>
          </div>
        )}

        {/* Event Details */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</div>
                <div className="font-bold text-foreground">
                  {new Date(event.start_date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horário</div>
                <div className="font-bold text-foreground">
                  {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {event.end_date && (
                    <>
                      {' às '}
                      {new Date(event.end_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl md:col-span-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Local</div>
                  <div className="font-bold text-foreground">{event.location}</div>
                </div>
              </div>
            )}

            {event.is_online && event.online_url && (
              <div className="flex items-center gap-4 p-4 bg-blue-500/10 rounded-2xl md:col-span-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evento Online</div>
                  <a 
                    href={event.online_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-blue-500 hover:underline flex items-center gap-2"
                  >
                    Acessar transmissão
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t border-border/50">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Sobre o Evento</h3>
              <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Capacity & Price */}
          {isUpcoming && (event.capacity || (event.is_paid && event.price)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              {event.capacity && (
                <div className="flex items-center gap-4 p-4 bg-amber-500/10 rounded-2xl">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vagas</div>
                    <div className="font-bold text-foreground">
                      {registrationCount} / {event.capacity}
                      {spotsLeft !== null && spotsLeft > 0 && (
                        <span className="text-emerald-500 ml-2 text-sm">
                          ({spotsLeft} restantes)
                        </span>
                      )}
                      {isFull && (
                        <span className="text-red-500 ml-2 text-sm">
                          (Lotado)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {event.is_paid && event.price && (
                <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Investimento</div>
                    <div className="font-black text-2xl text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(event.price))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Registration CTA */}
          {isUpcoming && (
            <div className="pt-6 border-t border-border/50">
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                <h3 className="font-black text-lg text-foreground mb-2">
                  {existingRegistration ? '✅ Você está inscrito!' : 'Participe deste evento!'}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {existingRegistration
                    ? 'Sua inscrição foi confirmada. Nos vemos lá!'
                    : 'Clique no botão abaixo para confirmar sua presença.'
                  }
                </p>

                <EventRegistrationButton
                  event={event}
                  existingRegistration={existingRegistration}
                  isAuthenticated={true}
                  isFull={isFull}
                  spotsLeft={spotsLeft}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
