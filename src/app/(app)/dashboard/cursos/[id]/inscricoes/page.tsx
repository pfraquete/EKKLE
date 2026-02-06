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
        <Link href={`/dashboard/cursos/${id}`} className="p-2 hover:bg-muted rounded-xl transition-colors" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Inscrições</h1>
          <p className="text-muted-foreground font-medium">{course.title}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-bold">{enrollments.length} inscritos</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Início das inscrições: {startDate ? startDate.toLocaleDateString('pt-BR') : 'Sem data definida'}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground">Membro</th>
              <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground">Data</th>
              <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground">Progresso</th>
              <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center px-4 py-10 text-muted-foreground font-bold">
                  Nenhuma inscrição encontrada.
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => {
                const enrollmentProfile = Array.isArray(enrollment.profiles)
                  ? enrollment.profiles[0]
                  : enrollment.profiles;

                return (
                  <tr key={enrollment.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground">{enrollmentProfile?.full_name || 'Sem nome'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{enrollmentProfile?.email || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-primary font-bold">{enrollment.progress_percentage}%</span>
                    </td>
                    <td className="px-4 py-3">
                      {enrollment.completed_at ? (
                        <span className="text-emerald-500 font-bold text-xs uppercase">Concluído</span>
                      ) : (
                        <span className="text-amber-500 font-bold text-xs uppercase">Em andamento</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
