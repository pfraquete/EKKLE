'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Shield,
  Users,
  ChevronLeft,
  Loader2,
  Search,
  UserPlus,
  X,
  Check
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  getDiscipuladores,
  getCellsWithSupervision,
  assignCellToDiscipulador,
  removeCellSupervision
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

interface CellWithSupervision {
  id: string
  name: string
  status: string
  leader: {
    id: string
    full_name: string
  } | null
  supervision: {
    id: string
    discipulador: {
      id: string
      full_name: string
    } | null
  } | null
}

export default function AssignCellsPage() {
  const [cells, setCells] = useState<CellWithSupervision[]>([])
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<CellWithSupervision | null>(null)
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cellsData, discipuladoresData] = await Promise.all([
        getCellsWithSupervision(),
        getDiscipuladores()
      ])
      setCells(cellsData)
      setDiscipuladores(discipuladoresData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedCell || !selectedDiscipulador) return

    try {
      setActionLoading(true)
      await assignCellToDiscipulador(selectedCell.id, selectedDiscipulador)
      toast.success('Celula atribuida com sucesso!')
      setAssignDialogOpen(false)
      setSelectedCell(null)
      setSelectedDiscipulador(null)
      await loadData()
    } catch (error) {
      console.error('Error assigning:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atribuir celula')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!selectedCell) return

    try {
      setActionLoading(true)
      await removeCellSupervision(selectedCell.id)
      toast.success('Supervisao removida com sucesso!')
      setRemoveDialogOpen(false)
      setSelectedCell(null)
      await loadData()
    } catch (error) {
      console.error('Error removing:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover supervisao')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredCells = cells.filter(cell =>
    cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.leader?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const cellsWithSupervision = filteredCells.filter(c => c.supervision?.discipulador)
  const cellsWithoutSupervision = filteredCells.filter(c => !c.supervision?.discipulador)

  const availableDiscipuladores = discipuladores.filter(d => d.supervisedCellsCount < 5)

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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/discipuladores">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground">Atribuir Celulas</h1>
          <p className="text-sm text-muted-foreground font-medium tracking-tight">
            Vincule celulas aos discipuladores
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por celula ou lider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 bg-background rounded-2xl border-border shadow-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-foreground">{cells.length}</p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total Celulas</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-primary">{cellsWithSupervision.length}</p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Com Supervisor</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-amber-500">{cellsWithoutSupervision.length}</p>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Sem Supervisor</p>
          </CardContent>
        </Card>
      </div>

      {/* Cells Without Supervision */}
      {cellsWithoutSupervision.length > 0 && (
        <Card className="border-none shadow-xl overflow-hidden rounded-3xl border-l-4 border-l-amber-500">
          <CardHeader className="border-b border-border/50 bg-amber-500/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Celulas sem Discipulador ({cellsWithoutSupervision.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {cellsWithoutSupervision.map((cell) => (
                <div
                  key={cell.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Home className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{cell.name}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Lider: {cell.leader?.full_name || 'Sem lider'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    onClick={() => {
                      setSelectedCell(cell)
                      setAssignDialogOpen(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Atribuir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cells With Supervision */}
      <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Celulas com Discipulador ({cellsWithSupervision.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cellsWithSupervision.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhuma celula atribuida ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cellsWithSupervision.map((cell) => (
                <div
                  key={cell.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{cell.name}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Lider: {cell.leader?.full_name || 'Sem lider'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">
                        {cell.supervision?.discipulador?.full_name}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={() => {
                          setSelectedCell(cell)
                          setAssignDialogOpen(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Alterar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          setSelectedCell(cell)
                          setRemoveDialogOpen(true)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Atribuir Discipulador</DialogTitle>
            <DialogDescription>
              Selecione um discipulador para supervisionar a celula <strong>{selectedCell?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {availableDiscipuladores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Todos os discipuladores ja estao no limite de 5 celulas.</p>
                <p className="text-xs mt-1">Promova novos discipuladores para continuar.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {availableDiscipuladores.map((discipulador) => (
                  <button
                    key={discipulador.id}
                    onClick={() => setSelectedDiscipulador(discipulador.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedDiscipulador === discipulador.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={discipulador.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {discipulador.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{discipulador.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {discipulador.supervisedCellsCount} de 5 celulas
                      </p>
                    </div>
                    {selectedDiscipulador === discipulador.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedCell(null)
                setSelectedDiscipulador(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDiscipulador || actionLoading}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Remover Supervisao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o discipulador <strong>{selectedCell?.supervision?.discipulador?.full_name}</strong> da celula <strong>{selectedCell?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false)
                setSelectedCell(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
