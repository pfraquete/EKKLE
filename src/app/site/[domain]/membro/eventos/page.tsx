import { getMyEventRegistrations } from '@/actions/event-registrations'
import { EventRegistrationCard } from '@/components/events/event-registration-card'
import { Calendar } from 'lucide-react'

export default async function MeusEventosPage() {
  const { upcoming, past } = await getMyEventRegistrations()

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Agenda Pessoal</h1>
        <p className="text-muted-foreground font-medium mt-1">Gerencie suas inscrições e participações em eventos</p>
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            Inscrições Ativas
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{upcoming.length}</span>
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-4xl">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
            <p className="text-muted-foreground font-medium">
              Você não possui inscrições ativas em eventos no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcoming.map((registration: any) => (
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
      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8 opacity-60">
            <div className="w-1.5 h-8 bg-muted-foreground/30 rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
              Histórico de Eventos
              <span className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full">{past.length}</span>
            </h2>
          </div>

          <div className="grid gap-4">
            {past.map((registration: any) => (
              <EventRegistrationCard
                key={registration.id}
                registration={registration}
                allowCancel={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
