import { getMyEventRegistrations } from '@/actions/event-registrations'
import { EventRegistrationCard } from '@/components/events/event-registration-card'
import { Calendar } from 'lucide-react'

export default async function MeusEventosPage() {
  const { upcoming, past } = await getMyEventRegistrations()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Meus Eventos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas inscrições em eventos
        </p>
      </div>

      {/* Upcoming Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Próximos Eventos ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Você não está inscrito em nenhum evento próximo.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
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
          <h2 className="text-2xl font-semibold mb-4">
            Eventos Anteriores ({past.length})
          </h2>
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
