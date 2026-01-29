import { getEvents } from '@/actions/events'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, BookOpen, Heart, Users, Edit, Wifi, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteEventButton } from '@/components/events/delete-event-button'
import { PublishEventToggle } from '@/components/events/publish-event-toggle'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

  const events = await getEvents()

  const getIcon = (category: string) => {
    switch (category) {
      case 'COURSE': return <BookOpen className="h-5 w-5 text-blue-500" />
      case 'PRAYER_CAMPAIGN': return <Heart className="h-5 w-5 text-rose-500" />
      case 'SERVICE': return <Users className="h-5 w-5 text-purple-500" />
      default: return <Calendar className="h-5 w-5 text-primary" />
    }
  }

  const getLabel = (category: string) => {
    switch (category) {
      case 'COURSE': return 'Curso'
      case 'PRAYER_CAMPAIGN': return 'Campanha'
      case 'SERVICE': return 'Culto'
      case 'COMMUNITY': return 'Comunhão'
      default: return 'Evento'
    }
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Eventos e Cursos</h1>
          <p className="text-muted-foreground font-medium">Gerencie a programação da sua igreja.</p>
        </div>
        <Button size="lg" className="rounded-full font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20" asChild>
          <Link href="/dashboard/eventos/novo">
            <Plus className="h-5 w-5 mr-2" />
            Criar Novo
          </Link>
        </Button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-muted">
            <Calendar className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhum evento criado</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Comece criando o primeiro evento, curso ou campanha de oração da sua igreja.</p>
            <Button variant="link" className="text-primary font-black mt-4" asChild>
              <Link href="/dashboard/eventos/novo">Criar agora</Link>
            </Button>
          </div>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-card rounded-3xl overflow-hidden group">
              {event.image_url && (
                <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary" className="font-bold flex items-center gap-1.5 px-3 py-1 rounded-full">
                    {getIcon(event.category)}
                    {getLabel(event.category)}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <PublishEventToggle eventId={event.id} isPublished={event.is_published ?? false} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <Link href={`/dashboard/eventos/${event.id}/editar`} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteEventButton id={event.id} />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-black text-foreground mb-2 line-clamp-1">{event.title}</h3>

                <div className="space-y-2 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(new Date(event.start_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>

                  {event.is_online ? (
                    <div className="flex items-center gap-2 text-blue-500">
                      <Wifi className="h-4 w-4" />
                      Online
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {event.location || 'Local a definir'}
                    </div>
                  )}

                  {event.is_paid && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-lg">
                      <DollarSign className="h-4 w-4" />
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(event.price))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
