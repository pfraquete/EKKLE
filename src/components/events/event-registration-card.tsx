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
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        )
      case 'WAITLIST':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Lista de Espera
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        )
      case 'ATTENDED':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
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
        return <Badge variant="outline" className="bg-green-50">Pago</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50">Pagamento Pendente</Badge>
      case 'REFUNDED':
        return <Badge variant="outline" className="bg-gray-50">Reembolsado</Badge>
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50">Pagamento Falhou</Badge>
      default:
        return null
    }
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Event Image */}
        <div className="relative w-full sm:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
              <Calendar className="w-12 h-12 text-primary/50" />
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link
                href={`/eventos/${event.id}`}
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                {event.title}
              </Link>
              <div className="flex gap-2">
                {getStatusBadge()}
                {getPaymentBadge()}
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{eventTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            )}
            {guest_count > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>+{guest_count} convidado(s)</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/eventos/${event.id}`)}
            >
              Ver Detalhes
            </Button>

            {payment_status === 'PENDING' && (
              <Button
                size="sm"
                onClick={() => router.push(`/eventos/${event.id}/checkout`)}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Pagar Agora
              </Button>
            )}

            {allowCancel && status !== 'CANCELLED' && status !== 'ATTENDED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancelar Inscrição
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar inscrição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua inscrição no evento "{event.title}"?
              {payment_status === 'PAID' && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-sm">
                  Seu pagamento será reembolsado de acordo com a política de cancelamento.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
