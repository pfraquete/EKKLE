'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, MapPin, Users, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cancelEventRegistration } from '@/actions/event-registrations'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface EventRegistrationCardProps {
  registration: any
  allowCancel: boolean
}

export function EventRegistrationCard({ registration, allowCancel }: EventRegistrationCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { event, status, payment_status, guest_count, checked_in } = registration

  const eventDate = format(new Date(event.start_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
  const eventTime = format(new Date(event.start_date), 'HH:mm', { locale: ptBR })

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const result = await cancelEventRegistration(registration.id)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erro ao cancelar',
          description: result.error,
        })
        setIsLoading(false)
        return
      }

      toast({
        title: 'Inscrição cancelada',
        description: result.message,
      })

      setShowCancelDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Cancellation error:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao cancelar sua inscrição.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            Confirmado
          </Badge>
        )
      case 'WAITLIST':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
            <Clock className="w-3 h-3 mr-1.5" />
            Em Espera
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
            <XCircle className="w-3 h-3 mr-1.5" />
            Cancelado
          </Badge>
        )
      case 'ATTENDED':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            Participou
          </Badge>
        )
      default:
        return null
    }
  }

  const getPaymentBadge = () => {
    if (!payment_status) return null

    switch (payment_status) {
      case 'PAID':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">Pago</Badge>
      case 'PENDING':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">Pendente</Badge>
      case 'REFUNDED':
        return <Badge className="bg-muted text-muted-foreground border-border/50 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">Reembolsado</Badge>
      case 'FAILED':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">Falhou</Badge>
      default:
        return null
    }
  }

  return (
    <div className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group">
      <div className="flex flex-col sm:flex-row gap-8 p-8 items-start sm:items-center">
        {/* Event Image */}
        <div className="relative w-full sm:w-56 h-36 flex-shrink-0 rounded-[1.5rem] overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-700">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="w-12 h-12 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0 py-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {getStatusBadge()}
            {getPaymentBadge()}
          </div>

          <div className="mb-6">
            <Link
              href={`/eventos/${event.id}`}
              className="font-black text-2xl text-foreground hover:text-primary transition-colors tracking-tight line-clamp-1 italic"
            >
              {event.title}
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary/50" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/50" />
              <span>{eventTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary/50" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            )}
            {guest_count > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/50" />
                <span>+{guest_count} CO-PARTICIPANTES</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              className="rounded-full px-6 border-border/50 font-black uppercase tracking-widest text-[10px] h-10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              onClick={() => router.push(`/eventos/${event.id}`)}
            >
              Documentação
            </Button>

            {payment_status === 'PENDING' && (
              <Button
                className="rounded-full px-6 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 bg-amber-500 text-white hover:bg-amber-600 transition-all duration-300"
                onClick={() => router.push(`/eventos/${event.id}/checkout`)}
              >
                <AlertCircle className="w-3.5 h-3.5 mr-2" />
                Validar Pagamento
              </Button>
            )}

            {allowCancel && status !== 'CANCELLED' && status !== 'ATTENDED' && (
              <Button
                variant="ghost"
                className="rounded-full px-6 font-black uppercase tracking-widest text-[10px] h-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                onClick={() => setShowCancelDialog(true)}
              >
                Anular
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-card border-border/50 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl tracking-tighter italic">Confirmar Anulação</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground pt-2">
              Deseja realmente anular sua participação no evento <span className="text-foreground font-bold italic">"{event.title}"</span>?
              {payment_status === 'PAID' && (
                <div className="mt-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-xs font-medium leading-relaxed">
                  <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" />
                    Aviso de Estorno
                  </div>
                  O montante investido será processado para reembolso seguindo os protocolos de cancelamento vigentes.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel disabled={isLoading} className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] h-12 border-border/50">Fechar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xl shadow-destructive/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Anulação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
