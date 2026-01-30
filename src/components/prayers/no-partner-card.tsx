'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Loader2 } from 'lucide-react'
import { updatePartnerPreferences } from '@/actions/prayer-partners'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NoPartnerCardProps {
  isOptedIn: boolean
}

export function NoPartnerCard({ isOptedIn }: NoPartnerCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleOptIn = async () => {
    setIsLoading(true)
    try {
      const result = await updatePartnerPreferences(true)
      if (result.success) {
        toast.success('Voce entrou no sistema de parceiros!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao participar')
      }
    } catch {
      toast.error('Erro ao participar')
    } finally {
      setIsLoading(false)
    }
  }

  if (isOptedIn) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-black mb-2">Aguardando Parceiro</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Voce esta participando do sistema de parceiros de oracao. Assim que houver outro membro disponivel,
            voces serao conectados automaticamente!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-black mb-2">Parceiro de Oracao Semanal</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          Toda semana voce sera conectado com outro membro da igreja para orarem um pelo outro.
          Compartilhem pedidos e fortaleçam-se na fe!
        </p>
        <Button onClick={handleOptIn} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Users className="w-4 h-4 mr-2" />
          )}
          Quero Participar
        </Button>
      </CardContent>
    </Card>
  )
}
