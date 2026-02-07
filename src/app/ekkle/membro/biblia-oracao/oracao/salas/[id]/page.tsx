'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Users,
  Video,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  XCircle,
  LogOut,
  VideoOff,
} from 'lucide-react'
import Link from 'next/link'
import {
  getPrayerRoomDetail,
  joinPrayerRoom,
  leavePrayerRoom,
  endPrayerRoom,
  cancelPrayerRoom,
  PrayerRoom,
} from '@/actions/prayer-rooms'
import { DailyVideoCall } from '@/components/video/daily-video-call'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Participant {
  id: string
  profile: {
    full_name: string
    photo_url: string | null
  }
  joined_at: string
}

export default function EkklePrayerRoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [room, setRoom] = useState<PrayerRoom | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [dailyToken, setDailyToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [ending, setEnding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isInCall, setIsInCall] = useState(false)

  const basePath = '/ekkle/membro/biblia-oracao/oracao/salas'

  useEffect(() => {
    loadRoom()
    const interval = setInterval(loadRoom, 30000)
    return () => clearInterval(interval)
  }, [id])

  async function loadRoom() {
    const result = await getPrayerRoomDetail(id)
    if (result.success && result.room) {
      setRoom(result.room)
      setParticipants(result.participants || [])
      if (result.dailyToken) {
        setDailyToken(result.dailyToken)
      }
    }
    setLoading(false)
  }

  async function handleJoin() {
    setJoining(true)
    const result = await joinPrayerRoom(id)
    if (result.success) {
      loadRoom()
      if (result.videoProvider === 'daily' && result.dailyRoomUrl) {
        if (result.dailyToken) {
          setDailyToken(result.dailyToken)
        }
        setIsInCall(true)
      } else if (result.joinUrl) {
        window.open(result.joinUrl, '_blank')
      }
    } else {
      toast.error(result.error || 'Erro ao processar ação')
    }
    setJoining(false)
  }

  async function handleLeave() {
    setLeaving(true)
    await leavePrayerRoom(id)
    setIsInCall(false)
    loadRoom()
    setLeaving(false)
  }

  async function handleEnd() {
    setEnding(true)
    const result = await endPrayerRoom(id)
    if (result.success) {
      router.push(basePath)
    } else {
      toast.error(result.error || 'Erro ao processar ação')
    }
    setEnding(false)
  }

  async function handleCancel() {
    const result = await cancelPrayerRoom(id)
    if (result.success) {
      router.push(basePath)
    } else {
      toast.error(result.error || 'Erro ao processar ação')
    }
  }

  function copyPassword() {
    if (room?.zoom_password) {
      navigator.clipboard.writeText(room.zoom_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sala não encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Esta sala pode ter sido encerrada ou cancelada
            </p>
            <Link href={basePath}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Salas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEnded = room.status === 'ENDED' || room.status === 'CANCELLED'
  const isDaily = room.video_provider === 'daily' && room.daily_room_url

  // Show embedded video call if using Daily and in call
  if (isDaily && isInCall && !isEnded) {
    return (
      <div className="container max-w-6xl py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleLeave}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{room.name}</h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Ao Vivo</Badge>
                <span className="text-sm text-muted-foreground">
                  {participants.length} participante{participants.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <VideoOff className="h-4 w-4 mr-2" />
                Encerrar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar sala de oração?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso encerrará a chamada de vídeo para todos os participantes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEnd} disabled={ending}>
                  {ending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Encerrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <DailyVideoCall
              roomUrl={room.daily_room_url!}
              token={dailyToken || undefined}
              onLeave={handleLeave}
              onParticipantJoined={() => loadRoom()}
              onParticipantLeft={() => loadRoom()}
              className="w-full aspect-video rounded-2xl"
              showControls={true}
            />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aguardando participantes...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.profile.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {p.profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{p.profile.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Default view: Room info with join button
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={basePath}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{room.name}</h1>
            {room.status === 'ACTIVE' && <Badge className="bg-green-500">Ao Vivo</Badge>}
            {room.status === 'SCHEDULED' && <Badge variant="secondary">Agendada</Badge>}
            {room.status === 'ENDED' && <Badge variant="outline">Encerrada</Badge>}
            {room.status === 'CANCELLED' && <Badge variant="destructive">Cancelada</Badge>}
          </div>
          {room.description && (
            <p className="text-muted-foreground mt-1">{room.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Informações da Sala
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {room.scheduled_start && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(room.scheduled_start), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(room.scheduled_start), 'HH:mm')}
                        {room.scheduled_end && ` - ${format(new Date(room.scheduled_end), 'HH:mm')}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!isEnded && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {isDaily ? '📹 Vídeo integrado' : room.video_provider === 'zoom' ? '🔗 Zoom' : '📺 Vídeo'}
                  </Badge>
                </div>
              )}

              {room.video_provider === 'zoom' && room.zoom_password && !isEnded && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Senha:</span>
                  <code className="font-mono">{room.zoom_password}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyPassword}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              {!isEnded && (
                <div className="flex gap-2 pt-2">
                  {isDaily ? (
                    <Button className="flex-1" size="lg" onClick={handleJoin} disabled={joining}>
                      {joining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Video className="h-4 w-4 mr-2" />
                      Entrar na Sala
                    </Button>
                  ) : room.zoom_join_url ? (
                    <a href={room.zoom_join_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full" size="lg" onClick={handleJoin}>
                        {joining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Entrar no Zoom
                      </Button>
                    </a>
                  ) : (
                    <Button className="flex-1" size="lg" disabled>
                      <VideoOff className="h-4 w-4 mr-2" />
                      Sala sem vídeo configurado
                    </Button>
                  )}
                  <Button variant="outline" size="lg" onClick={handleLeave} disabled={leaving}>
                    {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!isEnded && (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Sala</CardTitle>
                <CardDescription>Ações disponíveis para o organizador</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Encerrar Sala</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Encerrar sala de oração?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso encerrará a chamada e marcará a sala como finalizada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEnd} disabled={ending}>
                        {ending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Encerrar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancelar Sala</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar sala de oração?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso cancelará a sala permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Cancelar Sala
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante ainda</p>
              ) : (
                <div className="space-y-3">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.profile.photo_url || undefined} />
                        <AvatarFallback>{p.profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Entrou {format(new Date(p.joined_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {room.creator && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organizado por</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={room.creator.photo_url || undefined} />
                    <AvatarFallback>{room.creator.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{room.creator.full_name}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
