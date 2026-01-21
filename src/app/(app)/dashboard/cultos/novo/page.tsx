import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { ServiceForm } from '@/components/services/service-form'

export default async function NovoCultoPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')
  return <ServiceForm />
}
