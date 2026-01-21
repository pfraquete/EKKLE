import { getProfile } from '@/actions/auth'
import { getService } from '@/actions/services'
import { redirect, notFound } from 'next/navigation'
import { ServiceForm } from '@/components/services/service-form'

export default async function EditarCultoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')
  
  const service = await getService(id)
  if (!service) notFound()
  
  return <ServiceForm service={service} />
}
