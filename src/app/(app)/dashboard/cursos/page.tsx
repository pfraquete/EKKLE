import { getProfile } from '@/actions/auth'
import { adminGetCourses } from '@/actions/courses-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen, Video, Eye, EyeOff } from 'lucide-react'

export default async function CursosAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')

  const courses = await adminGetCourses()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
          <p className="text-muted-foreground mt-2">Crie e gerencie os cursos da sua igreja</p>
        </div>
        <Link href="/dashboard/cursos/novo" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum curso cadastrado</h3>
          <p className="text-muted-foreground mb-6">Comece criando seu primeiro curso</p>
          <Link href="/dashboard/cursos/novo" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            Criar Primeiro Curso
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: { id: string; thumbnail_url?: string; title: string; is_published: boolean; description?: string; course_videos: { count?: number } | Array<unknown> }) => {
            const videoCount = Array.isArray(course.course_videos) ? course.course_videos.length : course.course_videos?.count || 0

            return (
              <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow">
                {course.thumbnail_url && (
                  <div className="relative h-48 w-full bg-gray-100">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg flex-1 line-clamp-2">{course.title}</h3>
                    {course.is_published ? <Eye className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" /> : <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />}
                  </div>
                  {course.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>}
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Video className="w-4 h-4" />
                    <span>{videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
