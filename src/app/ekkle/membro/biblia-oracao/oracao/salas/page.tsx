'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  Video,
  Calendar,
  Plus,
  Clock,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { getPrayerRooms, createPrayerRoom, PrayerRoom } from '@/actions/prayer-rooms'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EkklePrayerRoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<PrayerRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    setLoading(true)
    const result = await getPrayerRooms()
    if (result.success && result.rooms) {
      setRooms(result.rooms)
    }
    setLoading(false)
  }

  async function handleCreateRoom() {
    if (!name.trim()) return

    setCreating(true)
    const result = await createPrayerRoom({
      name: name.trim(),
      description: description.trim() || undefined,
      scheduledStart: scheduledStart || undefined,
      isPublic,
    })

    if (result.success) {
      setDialogOpen(false)
      setName('')
      setDescription('')
      setScheduledStart('')
      setIsPublic(true)
      loadRooms()
    } else {
      toast.error(result.error || 'Erro ao criar sala')
    }
    setCreating(false)
  }

  function getStatusBadge(room: PrayerRoom) {
    switch (room.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Ao Vivo</Badge>
      case 'SCHEDULED':
        return <Badge variant="secondary">Agendada</Badge>
      default:
        return null
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/ekkle/membro/biblia-oracao/oracao">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Salas de Oração</h1>
            <p className="text-muted-foreground">Ore junto com outros irmãos</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Sala de Oração</DialogTitle>
              <DialogDescription>
                Crie uma sala para orar com outros membros via Zoom
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Sala</Label>
                <Input
                  id="name"
                  placeholder="Ex: Oração da Manhã"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito desta sala..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Agendamento (opcional)</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sala Pública</Label>
                  <p className="text-sm text-muted-foreground">
                    Visível para todos os membros
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRoom} disabled={!name.trim() || creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Sala
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sala disponível</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie uma nova sala para orar com outros irmãos
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Sala
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {room.name}
                      {getStatusBadge(room)}
                    </CardTitle>
                    {room.description && (
                      <CardDescription className="mt-1">
                        {room.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{room.participant_count || 0} participantes</span>
                    </div>
                    {room.scheduled_start && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(room.scheduled_start), "dd/MM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}
                    {room.creator && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>por {room.creator.full_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/ekkle/membro/biblia-oracao/oracao/salas/${room.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                    {room.zoom_join_url && room.status === 'ACTIVE' && (
                      <a
                        href={room.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Entrar
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
