import { getMyEventRegistrations } from '@/actions/event-registrations'
import { getPublishedEvents } from '@/actions/events'
import { EventRegistrationCard } from '@/components/events/event-registration-card'
import { Calendar, MapPin, Clock, Users, Ticket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function MeusEventosPage() {
    const [registrationsData, publishedEvents] = await Promise.all([
        getMyEventRegistrations(),
        getPublishedEvents()
    ])

    const { upcoming: myUpcoming, past: myPast } = registrationsData
    const { upcoming: availableEvents, past: pastEvents } = publishedEvents

    // Get IDs of events user is already registered for
    const registeredEventIds = new Set([
        ...myUpcoming.map((r: any) => r.event?.id),
        ...myPast.map((r: any) => r.event?.id)
    ].filter(Boolean))

    // Filter out events user is already registered for
    const eventsToRegister = availableEvents.filter(
        (event: any) => !registeredEventIds.has(event.id)
    )

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Eventos</h1>
                <p className="text-muted-foreground font-medium mt-1">Confira os eventos e gerencie suas inscrições</p>
            </div>

            {/* Available Events to Register */}
            {eventsToRegister.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                            Próximos Eventos
                            <span className="text-sm bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full">{eventsToRegister.length}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {eventsToRegister.map((event: any) => (
                            <Link
                                key={event.id}
                                href={`/membro/eventos/${event.id}`}
                                className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                            >
                                <div className="relative h-40 w-full overflow-hidden">
                                    {event.image_url ? (
                                        <Image
                                            src={event.image_url}
                                            alt={event.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            <Calendar className="w-12 h-12 text-primary/30" />
                                        </div>
                                    )}
                                    {event.is_paid && (
                                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Ticket className="w-3 h-3" />
                                            Pago
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                                        {event.title}
                                    </h3>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-primary font-semibold">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.start_date).toLocaleDateString('pt-BR', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'short',
                                            })}
                                            {' às '}
                                            {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>

                                        {event.location && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        )}

                                        {event.capacity && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                <span>Vagas limitadas: {event.capacity}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                                        {event.is_paid && event.price ? (
                                            <span className="font-black text-lg text-foreground">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(event.price))}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold text-sm">Gratuito</span>
                                        )}
                                        <span className="text-primary text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                            Ver detalhes →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* My Registrations */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                        Minhas Inscrições
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{myUpcoming.length}</span>
                    </h2>
                </div>

                {myUpcoming.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground font-medium">
                            Você não possui inscrições ativas no momento.
                        </p>
                        {eventsToRegister.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Confira os próximos eventos acima e inscreva-se!
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {myUpcoming.map((registration: any) => (
                            <EventRegistrationCard
                                key={registration.id}
                                registration={registration}
                                allowCancel={true}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Past Events */}
            {(myPast.length > 0 || pastEvents.length > 0) && (
                <section>
                    <div className="flex items-center gap-3 mb-6 opacity-60">
                        <div className="w-1.5 h-8 bg-muted-foreground/30 rounded-full" />
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                            Histórico
                        </h2>
                    </div>

                    {myPast.length > 0 && (
                        <div className="grid gap-3">
                            {myPast.map((registration: any) => (
                                <EventRegistrationCard
                                    key={registration.id}
                                    registration={registration}
                                    allowCancel={false}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* No Events at All */}
            {eventsToRegister.length === 0 && myUpcoming.length === 0 && myPast.length === 0 && (
                <div className="text-center py-24 bg-card border border-dashed border-border rounded-2xl">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhum evento disponível</h3>
                    <p className="text-muted-foreground font-medium">
                        Novos eventos serão publicados em breve. Fique atento!
                    </p>
                </div>
            )}
        </div>
    )
}
