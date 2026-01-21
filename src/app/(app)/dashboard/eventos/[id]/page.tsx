import { getProfile } from '@/actions/auth'
import { getEvent } from '@/actions/events'
import { redirect, notFound } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'

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

  return <EventForm event={event} />
}
