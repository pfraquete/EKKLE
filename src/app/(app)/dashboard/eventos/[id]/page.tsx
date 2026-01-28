import { getProfile } from '@/actions/auth'
import { getEvent } from '@/actions/events'
import { redirect, notFound } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'
import { getEventRegistrationCount } from '@/actions/event-registrations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'


type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditarEventoPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    redirect('/dashboard')
  }

  const event = await getEvent(id)
  if (!event) {
    notFound()
  }

  // Get registration count
  const { count: registrationCount } = await getEventRegistrationCount(id)

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Editar Evento</h1>
          <p className="text-muted-foreground mt-2">
            Atualize as informações do evento
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/eventos/${id}/inscricoes`}>
            <Users className="w-4 h-4 mr-2" />
            Ver Inscrições ({registrationCount})
          </Link>
        </Button>
      </div>

      {/* Event Form */}
      <EventForm initialData={event} />
    </div>
  )
}
