import { getProfile } from '@/actions/auth'
import { getEvents } from '@/actions/events'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Eye, EyeOff } from 'lucide-react'
import { EventActions } from '@/components/events/event-actions'

export default async function EventosAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    redirect('/dashboard')
  }

  const events = await getEvents()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Eventos</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie os eventos da sua igreja
          </p>
        </div>
        <Link
          href="/dashboard/eventos/novo"
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum evento cadastrado</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando seu primeiro evento
          </p>
          <Link
            href="/dashboard/eventos/novo"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Evento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isUpcoming = new Date(event.start_date) >= new Date()

            return (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border"
              >
                {event.image_url && (
                  <div className="relative h-48 w-full bg-gray-100">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg flex-1 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.is_published ? (
                      <Eye className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {!isUpcoming && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          Passado
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/eventos/${event.id}`}
                      className="flex-1 text-center bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/20 transition-colors text-sm"
                    >
                      Editar
                    </Link>
                    <EventActions eventId={event.id} canDelete={profile.role === 'PASTOR'} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
