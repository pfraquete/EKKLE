import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'

export default async function NovoEventoPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
    redirect('/dashboard')
  }

  return <EventForm />
}
