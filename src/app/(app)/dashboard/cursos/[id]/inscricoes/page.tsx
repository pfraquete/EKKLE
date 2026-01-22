import { getProfile } from '@/actions/auth'
import { adminGetCourse, adminGetCourseEnrollments } from '@/actions/courses-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CourseEnrollmentsPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')

  const course = await adminGetCourse(id)
  if (!course) redirect('/dashboard/cursos')

  const enrollments = await adminGetCourseEnrollments(id)
  const startDate = course.enrollment_start_date ? new Date(course.enrollment_start_date) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/cursos/${id}`} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-3xl font-bold">Inscrições</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{enrollments.length} inscritos</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Início das inscrições: {startDate ? startDate.toLocaleDateString('pt-BR') : 'Sem data definida'}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Membro</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Data</th>
              <th className="text-left px-4 py-3 font-semibold">Progresso</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center px-4 py-10 text-muted-foreground">
                  Nenhuma inscrição encontrada.
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{enrollment.profiles?.full_name || 'Sem nome'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{enrollment.profiles?.email || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.progress_percentage}%
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.completed_at ? 'Concluído' : 'Em andamento'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
