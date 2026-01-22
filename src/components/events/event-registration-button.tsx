'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useChurchNavigation } from '@/hooks/use-church-navigation'
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
import { registerForEvent, cancelEventRegistration } from '@/actions/event-registrations'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface EventRegistrationButtonProps {
  event: {
    id: string
    title: string
    is_paid: boolean
    price: number | null
  }
  existingRegistration: any
  isAuthenticated: boolean
  isFull: boolean
  spotsLeft: number | null
}

export function EventRegistrationButton({
  event,
  existingRegistration,
  isAuthenticated,
  isFull,
  spotsLeft,
}: EventRegistrationButtonProps) {
  const { push, router } = useChurchNavigation()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleRegister = async () => {
    if (!isAuthenticated) {
      push(`/login?redirect=/eventos/${event.id}`)
      return
    }

    setIsLoading(true)

    try {
      const result = await registerForEvent(event.id)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erro ao se inscrever',
          description: result.error,
        })
        setIsLoading(false)
        return
      }

      // If payment is required, redirect to checkout
      if (result.requiresPayment) {
        push(`/eventos/${event.id}/checkout`)
        return
      }

      // Show success message
      toast({
        title: 'Inscrição realizada!',
        description: result.message,
        variant: result.status === 'WAITLIST' ? 'default' : 'default',
      })

      // Refresh the page to update the button state
      router.refresh()
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua inscrição.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const result = await cancelEventRegistration(existingRegistration.id)

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

  // If not authenticated, show login button
  if (!isAuthenticated) {
    return (
      <Button
        size="lg"
        onClick={handleRegister}
        className="w-full sm:w-auto"
      >
        Fazer Login para Se Inscrever
      </Button>
    )
  }

  // If already registered, show status and cancel button
  if (existingRegistration) {
    const { status, payment_status } = existingRegistration

    if (status === 'CANCELLED') {
      // Allow re-registration if cancelled
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Inscrição cancelada anteriormente</span>
          </div>
          <Button
            size="lg"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Inscrever-se Novamente
          </Button>
        </div>
      )
    }

    if (status === 'WAITLIST') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Você está na lista de espera</span>
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Sair da Lista de Espera
          </Button>

          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair da lista de espera? Você perderá sua posição na fila.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sair da Lista
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }

    if (status === 'CONFIRMED' || status === 'ATTENDED') {
      // Check if payment is pending
      if (payment_status === 'PENDING') {
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Pagamento pendente</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => router.push(`/eventos/${event.id}/checkout`)}
                className="w-full sm:w-auto"
              >
                Realizar Pagamento
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar Inscrição
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">
              {status === 'ATTENDED' ? 'Você compareceu a este evento' : 'Você está inscrito neste evento'}
            </span>
          </div>
          {status !== 'ATTENDED' && (
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => push('/membro/eventos')}
                className="w-full sm:w-auto"
              >
                Ver Meus Eventos
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
              >
                Cancelar Inscrição
              </Button>
            </div>
          )}

          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar inscrição</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar sua inscrição no evento "{event.title}"?
                  {existingRegistration.payment_status === 'PAID' && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
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
  }

  // Not registered yet - show register button
  if (isFull) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Evento lotado</span>
        </div>
        <Button
          size="lg"
          onClick={handleRegister}
          disabled={isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar na Lista de Espera
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {spotsLeft && spotsLeft <= 5 && (
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Últimas {spotsLeft} vagas!</span>
        </div>
      )}
      <Button
        size="lg"
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {event.is_paid && event.price
          ? `Inscrever-se - ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(event.price)}`
          : 'Inscrever-se Gratuitamente'}
      </Button>
    </div>
  )
}
