import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Radio, Search, Church, Calendar, Clock } from 'lucide-react'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

export default async function EkkleLivesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get Ekkle Hub live streams (published from Ekkle Hub)
  const { data: lives } = await supabase
    .from('live_streams')
    .select(`
      id,
      title,
      description,
      stream_url,
      thumbnail_url,
      scheduled_start,
      status,
      created_at
    `)
    .eq('church_id', EKKLE_HUB_ID)
    .eq('is_published', true)
    .order('scheduled_start', { ascending: false })
    .limit(20)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Ao Vivo
          </span>
        )
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded-full">
            <Calendar className="w-3 h-3" />
            Agendada
          </span>
        )
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider rounded-full">
            Encerrada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Lives Ekkle
        </h1>
        <p className="text-muted-foreground text-lg">
          Transmissões ao vivo e conteúdo exclusivo
        </p>
      </div>

      {/* Lives List */}
      {!lives || lives.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhuma live disponível</h3>
            <p className="text-muted-foreground mb-6">
              Em breve teremos transmissões ao vivo para você. Enquanto isso, que tal encontrar sua igreja?
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
        <div className="space-y-4">
          {lives.map((live) => (
            <Card
              key={live.id}
              className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg"
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-48 lg:w-64 aspect-video sm:aspect-auto sm:h-32 lg:h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                    <Radio className="w-10 h-10 text-primary/50" />
                    {live.status === 'live' && (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                          <Radio className="w-8 h-8 text-red-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-black text-lg line-clamp-1">
                        {live.title}
                      </h3>
                      {getStatusBadge(live.status)}
                    </div>
                    {live.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {live.description}
                      </p>
                    )}
                    {live.scheduled_start && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(live.scheduled_start)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(live.scheduled_start)}</span>
                        </div>
                      </div>
                    )}
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
            <h3 className="font-bold mb-1">Quer mais transmissões?</h3>
            <p className="text-sm text-muted-foreground">
              Entre em uma igreja para acessar lives exclusivas da sua comunidade!
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
