'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Users,
  Plus,
  Phone,
  Mail,
  ChevronDown,
  UserMinus,
  Home,
  Loader2,
  Search,
  AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  getDiscipuladores,
  getPotentialDiscipuladores,
  promoteToDiscipulador,
  demoteFromDiscipulador
} from '@/actions/discipulador-admin'

interface Discipulador {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  photo_url: string | null
  cell_id: string | null
  supervisedCellsCount: number
}

interface PotentialDiscipulador {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  photo_url: string | null
  role: string
  member_stage: string | null
}

export default function DiscipuladoresPage() {
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([])
  const [potentials, setPotentials] = useState<PotentialDiscipulador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false)
  const [demoteDialogOpen, setDemoteDialogOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [discipuladoresData, potentialsData] = await Promise.all([
        getDiscipuladores(),
        getPotentialDiscipuladores()
      ])
      setDiscipuladores(discipuladoresData)
      setPotentials(potentialsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedPerson) return

    try {
      setActionLoading(true)
      await promoteToDiscipulador(selectedPerson)
      toast.success('Membro promovido a Discipulador!')
      setPromoteDialogOpen(false)
      setSelectedPerson(null)
      await loadData()
    } catch (error) {
      console.error('Error promoting:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao promover membro')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDemote = async () => {
    if (!selectedPerson) return

    try {
      setActionLoading(true)
      await demoteFromDiscipulador(selectedPerson)
      toast.success('Discipulador removido com sucesso')
      setDemoteDialogOpen(false)
      setSelectedPerson(null)
      await loadData()
    } catch (error) {
      console.error('Error demoting:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover discipulador')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPotentials = potentials.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'LEADER':
        return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Lider</Badge>
      case 'MEMBER':
        return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">Membro</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Discipuladores</h1>
          <p className="text-sm text-muted-foreground font-medium tracking-tight">
            Gerencie os discipuladores da sua igreja
          </p>
        </div>

        <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold rounded-xl shadow-lg gap-2">
              <Plus className="h-4 w-4" />
              Novo Discipulador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Promover a Discipulador</DialogTitle>
              <DialogDescription>
                Selecione um membro ou lider para promover ao papel de Discipulador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredPotentials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum membro encontrado</p>
                  </div>
                ) : (
                  filteredPotentials.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPerson(person.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedPerson === person.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {person.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm">{person.full_name}</p>
                        <p className="text-xs text-muted-foreground">{person.email}</p>
                      </div>
                      {getRoleBadge(person.role)}
                    </button>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPromoteDialogOpen(false)
                  setSelectedPerson(null)
                  setSearchTerm('')
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePromote}
                disabled={!selectedPerson || actionLoading}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Promover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-foreground">{discipuladores.length}</p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Discipuladores</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-primary">
              {discipuladores.reduce((acc, d) => acc + d.supervisedCellsCount, 0)}
            </p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Celulas Supervisionadas</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-amber-500">
              {discipuladores.filter(d => d.supervisedCellsCount < 3).length}
            </p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Abaixo de 3 Celulas</p>
          </CardContent>
        </Card>
      </div>

      {/* Discipuladores List */}
      <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Lista de Discipuladores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {discipuladores.length === 0 ? (
            <div className="p-20 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum discipulador cadastrado.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Clique em "Novo Discipulador" para promover um membro.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {discipuladores.map((discipulador) => (
                <div
                  key={discipulador.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={discipulador.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {discipulador.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{discipulador.full_name}</h4>
                        <Badge variant="secondary" className="text-xs font-bold">
                          <Shield className="h-3 w-3 mr-1" />
                          Discipulador
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                        {discipulador.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {discipulador.phone}
                          </span>
                        )}
                        {discipulador.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {discipulador.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className={`text-lg font-black ${
                          discipulador.supervisedCellsCount >= 3 ? 'text-primary' : 'text-amber-500'
                        }`}>
                          {discipulador.supervisedCellsCount}
                        </span>
                        <span className="text-sm text-muted-foreground">/5</span>
                      </div>
                      <p className="text-xs text-muted-foreground">celulas</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPerson(discipulador.id)
                            setDemoteDialogOpen(true)
                          }}
                          className="text-red-500 focus:text-red-500"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remover como Discipulador
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demote Dialog */}
      <Dialog open={demoteDialogOpen} onOpenChange={setDemoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Remover Discipulador
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este discipulador? Ele voltara ao papel de Membro e todas as celulas supervisionadas serao desvinculadas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDemoteDialogOpen(false)
                setSelectedPerson(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDemote}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Remocao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
