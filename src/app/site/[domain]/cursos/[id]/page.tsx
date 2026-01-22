import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { getCourseEnrollment } from '@/actions/courses'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Video, ArrowLeft, Lock, Clock } from 'lucide-react'
import { EnrollButton } from '@/components/courses/enroll-button'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export default async function CursoPage({ params }: PageProps) {
  const { id } = await params
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .single()

  if (!course) {
    notFound()
  }

  // Fetch course videos
  const { data: videos } = await supabase
    .from('course_videos')
    .select('*')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is enrolled (if authenticated)
  const enrollment = user ? await getCourseEnrollment(id) : null
  const isEnrolled = !!enrollment

  const totalDuration = videos?.reduce((acc, video) => acc + (video.duration_seconds || 0), 0) || 0

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para cursos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Course Image */}
              {course.thumbnail_url ? (
                <div className="relative h-96 w-full">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-96 w-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <BookOpen className="w-32 h-32 text-white opacity-50" />
                </div>
              )}

              {/* Course Details */}
              <div className="p-8">
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Video className="w-5 h-5" />
                    <span>
                      {videos?.length || 0} {videos?.length === 1 ? 'vídeo' : 'vídeos'}
                    </span>
                  </div>
                  {totalDuration > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {course.description && (
                  <div className="prose max-w-none">
                    <h2 className="text-2xl font-bold mb-4">Sobre o Curso</h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Video List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Conteúdo do Curso</h2>

              {videos && videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className={`p-4 rounded-lg border ${
                        isEnrolled
                          ? 'hover:bg-gray-50 cursor-pointer'
                          : 'bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                            {video.title}
                          </h3>
                          {video.duration_seconds > 0 && (
                            <p className="text-xs text-gray-500">
                              {formatDuration(video.duration_seconds)}
                            </p>
                          )}
                        </div>
                        {!isEnrolled && <Lock className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum vídeo disponível ainda</p>
              )}

              {/* Enrollment CTA */}
              <div className="mt-6">
                {!isEnrolled && (
                  <p className="text-sm text-gray-600 mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    Faça login ou crie uma conta para acessar o conteúdo completo do curso
                  </p>
                )}
                <EnrollButton
                  courseId={id}
                  isEnrolled={isEnrolled}
                  isAuthenticated={!!user}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
