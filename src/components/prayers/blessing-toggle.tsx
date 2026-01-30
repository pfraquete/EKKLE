'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markBlessingReceived } from '@/actions/prayers'

interface BlessingToggleProps {
  prayerId: string
  isBlessed: boolean
  blessedAt?: string | null
  blessedNotes?: string | null
  onToggled?: () => void
}

export function BlessingToggle({
  prayerId,
  isBlessed,
  blessedAt,
  blessedNotes,
  onToggled,
}: BlessingToggleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMarkBlessed = async () => {
    setIsSubmitting(true)
    try {
      const result = await markBlessingReceived(prayerId, notes || undefined)
      if (result.success) {
        setIsDialogOpen(false)
        onToggled?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isBlessed) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-amber-500">Bencao Recebida!</span>
        </div>
        {blessedNotes && (
          <p className="text-sm text-foreground mb-2">{blessedNotes}</p>
        )}
        {blessedAt && (
          <p className="text-xs text-muted-foreground">
            {new Date(blessedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          'w-full py-6 border-dashed border-2',
          'border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50'
        )}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Marcar Bencao Recebida
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Registrar Bencao
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Que maravilha! Registre como Deus respondeu essa oracao e glorifique
              Seu nome.
            </p>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Testemunho (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conte como Deus agiu..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkBlessed}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Confirmar Bencao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
