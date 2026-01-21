import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { CourseEditForm } from '@/components/courses-admin/course-edit-form'

export default async function NovoCursoPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')
  return <CourseEditForm />
}
