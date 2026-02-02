'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { markRequestAsPrayed, markRequestAsAnswered, type PartnerPrayerRequest } from '@/actions/prayer-partners'
import { toast } from 'sonner'

interface PrayerRequestListProps {
  requests: PartnerPrayerRequest[]
  currentUserId: string
}

export function PrayerRequestList({ requests, currentUserId }: PrayerRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nenhum pedido ainda</p>
        <p className="text-sm">Compartilhe seu primeiro pedido de oracao!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <PrayerRequestCard
          key={request.id}
          request={request}
          isOwn={request.sender_id === currentUserId}
        />
      ))}
    </div>
  )
}

function PrayerRequestCard({
  request,
  isOwn
}: {
  request: PartnerPrayerRequest
  isOwn: boolean
}) {
  const [isPrayingLoading, setIsPrayingLoading] = useState(false)
  const [isAnsweredOpen, setIsAnsweredOpen] = useState(false)
  const [testimony, setTestimony] = useState('')
  const [isAnsweredLoading, setIsAnsweredLoading] = useState(false)

  const initials = (request.sender_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const handleMarkAsPrayed = async () => {
    setIsPrayingLoading(true)
    try {
      const result = await markRequestAsPrayed(request.id)
      if (result.success) {
        toast.success('Marcado como orado!')
      } else {
        toast.error(result.error || 'Erro ao marcar')
      }
    } catch {
      toast.error('Erro ao marcar')
    } finally {
      setIsPrayingLoading(false)
    }
  }

  const handleMarkAsAnswered = async () => {
    setIsAnsweredLoading(true)
    try {
      const result = await markRequestAsAnswered(request.id, testimony)
      if (result.success) {
        toast.success('Gloria a Deus! Pedido marcado como respondido!')
        setIsAnsweredOpen(false)
      } else {
        toast.error(result.error || 'Erro ao marcar')
      }
    } catch {
      toast.error('Erro ao marcar')
    } finally {
      setIsAnsweredLoading(false)
    }
  }

  return (
    <Card className={isOwn ? 'border-primary/20 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={request.sender_photo || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {isOwn ? 'Voce' : request.sender_name}
              </span>
              {request.is_urgent && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Urgente
                </Badge>
              )}
              {request.is_answered && (
                <Badge className="text-xs px-1.5 py-0 bg-emerald-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Respondido
                </Badge>
              )}
              {request.is_prayed && !request.is_answered && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  <Check className="w-3 h-3 mr-1" />
                  Orado
                </Badge>
              )}
            </div>

            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
              {request.content}
            </p>

            {request.response_note && (
              <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <Heart className="w-3 h-3 inline mr-1" />
                  {request.response_note}
                </p>
              </div>
            )}

            {request.testimony && (
              <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Testemunho: {request.testimony}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>

              <div className="flex items-center gap-2">
                {!isOwn && !request.is_prayed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsPrayed}
                    disabled={isPrayingLoading}
                    className="text-xs"
                  >
                    {isPrayingLoading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Orei
                  </Button>
                )}

                {isOwn && !request.is_answered && (
                  <Dialog open={isAnsweredOpen} onOpenChange={setIsAnsweredOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-emerald-600"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Deus Respondeu
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deus Respondeu sua Oracao!</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Compartilhe seu testemunho (opcional)</Label>
                          <Textarea
                            placeholder="Como Deus respondeu sua oracao?"
                            value={testimony}
                            onChange={(e) => setTestimony(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <Button
                          onClick={handleMarkAsAnswered}
                          disabled={isAnsweredLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-600"
                        >
                          {isAnsweredLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Marcar como Respondido
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
