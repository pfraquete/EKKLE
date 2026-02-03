'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  title: string
  start_date: string
  location?: string | null
  registrations_count?: number
}

interface UpcomingEventsCardProps {
  events: Event[]
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br from-black-surface/90 via-black-surface/70 to-black-elevated/50 backdrop-blur-xl border-gray-border/50">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400 rounded-2xl flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-white-primary">
                Próximos Eventos
              </p>
              <p className="text-xs text-gray-text-muted">
                {events.length} agendado{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link href="/calendario">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 rounded-xl"
            >
              Ver Tudo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Events List */}
        <div className="flex-1 space-y-3">
          {events.length > 0 ? events.map((event, index) => {
            const eventDate = new Date(event.start_date)
            const isToday = new Date().toDateString() === eventDate.toDateString()
            const isTomorrow = new Date(Date.now() + 86400000).toDateString() === eventDate.toDateString()
            
            return (
              <Link
                key={event.id}
                href={`/dashboard/eventos/${event.id}`}
                className={cn(
                  'group flex gap-4 p-4 rounded-2xl transition-all duration-300',
                  'bg-gradient-to-r from-black-elevated/80 to-black-elevated/40',
                  'border border-gray-border/30 hover:border-cyan-500/40',
                  'hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]',
                  'hover:translate-x-1'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Date Badge */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
                  'transition-all duration-300',
                  isToday 
                    ? 'bg-gradient-to-br from-gold to-gold-dark text-black-absolute shadow-gold-glow' 
                    : isTomorrow
                      ? 'bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-black-surface border border-gray-border group-hover:border-cyan-500/30'
                )}>
                  <span className={cn(
                    'text-lg font-black leading-none',
                    !isToday && !isTomorrow && 'text-white-primary'
                  )}>
                    {format(eventDate, 'dd')}
                  </span>
                  <span className={cn(
                    'text-[10px] uppercase font-bold tracking-wider mt-0.5',
                    !isToday && !isTomorrow && 'text-gray-text-muted'
                  )}>
                    {format(eventDate, 'MMM', { locale: ptBR })}
                  </span>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white-primary truncate group-hover:text-cyan-400 transition-colors">
                      {event.title}
                    </p>
                    {isToday && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-bold rounded-full whitespace-nowrap">
                        <Sparkles className="h-3 w-3" />
                        HOJE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-gray-text-muted">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {format(eventDate, "HH:mm")}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-gray-text-muted">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs font-medium truncate max-w-[100px]">
                          {event.location}
                        </span>
                      </div>
                    )}
                    {event.registrations_count !== undefined && event.registrations_count > 0 && (
                      <div className="flex items-center gap-1 text-gray-text-muted">
                        <Users className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {event.registrations_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-gray-text-muted group-hover:text-cyan-400 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            )
          }) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-black-elevated to-black-surface rounded-3xl flex items-center justify-center mb-4 border border-gray-border/50">
                <Calendar className="h-10 w-10 text-gray-text-muted" />
              </div>
              <p className="text-sm text-gray-text-secondary font-medium text-center">
                Nenhum evento agendado
              </p>
              <Link href="/dashboard/eventos/novo" className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  Criar Evento
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
