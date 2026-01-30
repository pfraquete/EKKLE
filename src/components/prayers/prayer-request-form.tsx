'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Send, AlertTriangle, Loader2 } from 'lucide-react'
import { createPrayerRequest } from '@/actions/prayer-partners'
import { toast } from 'sonner'

interface PrayerRequestFormProps {
  partnershipId: string
  partnerName: string
}

export function PrayerRequestForm({ partnershipId, partnerName }: PrayerRequestFormProps) {
  const [content, setContent] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Digite seu pedido de oracao')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createPrayerRequest(partnershipId, content.trim(), isUrgent)

      if (result.success) {
        toast.success('Pedido enviado para ' + partnerName)
        setContent('')
        setIsUrgent(false)
      } else {
        toast.error(result.error || 'Erro ao enviar pedido')
      }
    } catch {
      toast.error('Erro ao enviar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="content" className="text-sm font-bold">
          Compartilhe seu pedido de oracao
        </Label>
        <Textarea
          id="content"
          placeholder="Escreva aqui seu pedido de oracao..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-2 min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {content.length}/1000 caracteres
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="urgent"
            checked={isUrgent}
            onCheckedChange={setIsUrgent}
          />
          <Label
            htmlFor="urgent"
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Urgente
          </Label>
        </div>

        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Enviar
        </Button>
      </div>
    </form>
  )
}
