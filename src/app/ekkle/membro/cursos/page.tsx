import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Clock, PlayCircle, Search, Church } from 'lucide-react'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

export default async function EkkleCursosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get Ekkle Hub courses (published courses from Ekkle Hub church)
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      created_at
    `)
    .eq('church_id', EKKLE_HUB_ID)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Get video counts for each course
  const coursesWithCounts = await Promise.all(
    (courses || []).map(async (course) => {
      const { count } = await supabase
        .from('course_videos')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('is_published', true)

      return {
        ...course,
        video_count: count || 0,
      }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Cursos Ekkle
        </h1>
        <p className="text-muted-foreground text-lg">
          Aprenda sobre fé, comunidade e crescimento espiritual
        </p>
      </div>

      {/* Courses Grid */}
      {coursesWithCounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground mb-6">
              Em breve teremos cursos exclusivos para você. Enquanto isso, que tal encontrar sua igreja?
            </p>
            <Link
              href="/ekkle/membro/igrejas"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold"
            >
              <Search className="w-4 h-4" />
              Pesquisar Igrejas
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithCounts.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg group"
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen className="w-12 h-12 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-black text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.video_count} vídeos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Curso Ekkle</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA to find church */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Church className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Quer mais conteúdo?</h3>
            <p className="text-sm text-muted-foreground">
              Entre em uma igreja para acessar cursos exclusivos da sua comunidade!
            </p>
          </div>
          <Link
            href="/ekkle/membro/igrejas"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Pesquisar Igrejas
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
