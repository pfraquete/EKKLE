'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Baby,
  Users,
  UserPlus,
} from 'lucide-react'
import {
  startKidsWorshipService,
  completeKidsWorshipService,
  cancelKidsWorshipService,
} from '@/actions/kids-worship'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  serviceId: string
  status: string
}

export function WorshipServiceActions({ serviceId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [completeData, setCompleteData] = useState({
    kids_present: 0,
    volunteers_present: 0,
    visitors_count: 0,
    notes: '',
  })

  const handleStart = async () => {
    setLoading(true)
    try {
      const result = await startKidsWorshipService(serviceId)
      if (result.success) {
        toast.success('Culto iniciado!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao iniciar culto')
      }
    } catch (error) {
      toast.error('Erro ao iniciar culto')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const result = await completeKidsWorshipService(serviceId, {
        kids_present: completeData.kids_present,
        volunteers_present: completeData.volunteers_present,
        visitors_count: completeData.visitors_count,
        notes: completeData.notes || undefined,
      })
      if (result.success) {
        toast.success('Culto concluído!')
        setShowCompleteDialog(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao concluir culto')
      }
    } catch (error) {
      toast.error('Erro ao concluir culto')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este culto?')) return

    setLoading(true)
    try {
      const result = await cancelKidsWorshipService(serviceId)
      if (result.success) {
        toast.success('Culto cancelado')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao cancelar culto')
      }
    } catch (error) {
      toast.error('Erro ao cancelar culto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'SCHEDULED' && (
          <>
            <Button
              onClick={handleStart}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Iniciar Culto
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              className="text-red-500 hover:text-red-600"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </>
        )}

        {status === 'IN_PROGRESS' && (
          <Button
            onClick={() => setShowCompleteDialog(true)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir Culto
              </>
            )}
          </Button>
        )}
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Culto Kids</DialogTitle>
            <DialogDescription>
              Registre a presença e observações do culto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kids_present" className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-amber-500" />
                Crianças presentes
              </Label>
              <Input
                id="kids_present"
                type="number"
                min="0"
                value={completeData.kids_present}
                onChange={(e) =>
                  setCompleteData({
                    ...completeData,
                    kids_present: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volunteers_present" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Voluntários presentes
              </Label>
              <Input
                id="volunteers_present"
                type="number"
                min="0"
                value={completeData.volunteers_present}
                onChange={(e) =>
                  setCompleteData({
                    ...completeData,
                    volunteers_present: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitors_count" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-500" />
                Visitantes
              </Label>
              <Input
                id="visitors_count"
                type="number"
                min="0"
                value={completeData.visitors_count}
                onChange={(e) =>
                  setCompleteData({
                    ...completeData,
                    visitors_count: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={completeData.notes}
                onChange={(e) =>
                  setCompleteData({ ...completeData, notes: e.target.value })
                }
                placeholder="Observações sobre o culto..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Concluir Culto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
