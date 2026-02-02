'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PartnerCardProps {
  partnerName: string
  partnerPhoto: string | null
  weekStart: string
  weekEnd: string
  isNew?: boolean
}

export function PartnerCard({
  partnerName,
  partnerPhoto,
  weekStart,
  weekEnd,
  isNew = false
}: PartnerCardProps) {
  const initials = partnerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const formattedStart = format(parseISO(weekStart), "d 'de' MMM", { locale: ptBR })
  const formattedEnd = format(parseISO(weekEnd), "d 'de' MMM", { locale: ptBR })

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-6">
        {isNew && (
          <div className="flex items-center gap-2 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Novo Parceiro Esta Semana!
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={partnerPhoto || undefined} alt={partnerName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Seu Parceiro de Oracao
              </span>
            </div>
            <h3 className="text-xl font-black text-foreground">
              {partnerName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                {formattedStart} - {formattedEnd}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Orem um pelo outro esta semana. Compartilhem pedidos de oracao e fortaleçam-se mutuamente na fe.
        </p>
      </CardContent>
    </Card>
  )
}
