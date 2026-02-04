'use client'

import { useState } from 'react'
import { checkInChild, checkOutChild } from '@/actions/kids-parental-consent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, LogIn, LogOut } from 'lucide-react'

interface CheckInOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'check_in' | 'check_out'
  consentId: string
  childName: string
  onSuccess?: () => void
}

export function CheckInOutDialog({
  open,
  onOpenChange,
  type,
  consentId,
  childName,
  onSuccess,
}: CheckInOutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [personName, setPersonName] = useState('')
  const [personDocument, setPersonDocument] = useState('')
  const [notes, setNotes] = useState('')
  const { toast } = useToast()

  const isCheckOut = type === 'check_out'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = {
        consent_id: consentId,
        person_name: personName || undefined,
        person_document: personDocument || undefined,
        notes: notes || undefined,
      }

      const result = isCheckOut
        ? await checkOutChild(data)
        : await checkInChild(data)

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: isCheckOut
            ? `${childName} fez check-out com sucesso`
            : `${childName} fez check-in com sucesso`,
        })
        onOpenChange(false)
        onSuccess?.()
        // Reset
        setPersonName('')
        setPersonDocument('')
        setNotes('')
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível completar a operação',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCheckOut ? (
              <>
                <LogOut className="h-5 w-5" />
                Check-out
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Check-in
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCheckOut
              ? `Registrar saída de ${childName}`
              : `Registrar entrada de ${childName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCheckOut && (
            <>
              <div className="space-y-2">
                <Label htmlFor="personName">Quem está buscando? *</Label>
                <Input
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personDocument">Documento (RG/CPF)</Label>
                <Input
                  id="personDocument"
                  value={personDocument}
                  onChange={(e) => setPersonDocument(e.target.value)}
                  placeholder="Número do documento"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (isCheckOut && !personName)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : isCheckOut ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Confirmar Check-out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Confirmar Check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
