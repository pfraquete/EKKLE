import { getProfile } from '@/actions/auth'
import { adminGetCourse, adminGetCourseVideos } from '@/actions/courses-admin'
import { redirect, notFound } from 'next/navigation'
import { CourseDetailView } from '@/components/courses-admin/course-detail-view'

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')
  
  const course = await adminGetCourse(id)
  if (!course) notFound()
  
  const videos = await adminGetCourseVideos(id)
  
  return <CourseDetailView course={course} videos={videos} canDelete={profile.role === 'PASTOR'} />
}
