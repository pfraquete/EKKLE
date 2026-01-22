import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Play, CheckCircle } from 'lucide-react'

export default async function MeusCursosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        thumbnail_url,
        course_videos (count)
      )
    `)
    .eq('profile_id', user.id)
    .eq('church_id', church.id)
    .order('enrolled_at', { ascending: false })

  // Get available courses (not enrolled)
  const enrolledCourseIds = enrollments?.map((e: { course_id: string }) => e.course_id) || []
  const { data: availableCourses } = await supabase
    .from('courses')
    .select(`
      *,
      course_videos (count)
    `)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .not('id', 'in', `(${enrolledCourseIds.join(',') || 'null'})`)
    .order('order_index', { ascending: true })

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meus Cursos</h1>

      {/* Enrolled Courses */}
      {enrollments && enrollments.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Cursos em Andamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enrollment: { id: string; progress_percentage: number; completed_at?: string; courses: { id: string; title: string; description?: string; thumbnail_url?: string; course_videos: { count?: number } | Array<unknown> } }) => {
              const course = enrollment.courses
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              return (
                <Link
                  key={enrollment.id}
                  href={`/membro/cursos/${course.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {course.thumbnail_url ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3">{course.title}</h3>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-semibold text-primary">
                          {enrollment.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Play className="w-4 h-4" />
                        <span>{videoCount} vídeos</span>
                      </div>
                      {enrollment.completed_at ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">Concluído</span>
                        </div>
                      ) : (
                        <span className="text-primary font-semibold">
                          Continuar →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Courses */}
      {availableCourses && availableCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Cursos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course: { id: string; title: string; description?: string; thumbnail_url?: string; course_videos: { count?: number } | Array<unknown> }) => {
              const videoCount = Array.isArray(course.course_videos)
                ? course.course_videos.length
                : course.course_videos?.count || 0

              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {course.thumbnail_url ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Play className="w-4 h-4" />
                      <span>{videoCount} vídeos</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!enrollments || enrollments.length === 0) &&
        (!availableCourses || availableCourses.length === 0) && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-gray-600">
              Em breve teremos cursos incríveis para você
            </p>
          </div>
        )}
    </div>
  )
}
