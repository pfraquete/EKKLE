import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Video } from 'lucide-react'

export default async function CursosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    return null
  }

  // Fetch all published courses with video counts
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      course_videos (count)
    `)
    .eq('church_id', church.id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Nossos Cursos</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Cresça espiritualmente com nossos cursos e ensinamentos
          </p>
        </div>

        {/* Courses Grid */}
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
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
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Video className="w-4 h-4" />
                        <span>
                          {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}
                        </span>
                      </div>
                      <span className="text-primary font-semibold text-sm">
                        Ver curso →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-gray-600">
              Em breve teremos cursos incríveis para você
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Faça parte da nossa comunidade
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Crie uma conta para acessar os cursos, acompanhar seu progresso e participar
            da nossa comunidade.
          </p>
          <Link
            href="/membro"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
