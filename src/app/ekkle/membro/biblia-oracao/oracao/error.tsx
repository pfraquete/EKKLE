'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function OracaoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Oração] Error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Erro na página de oração
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Não foi possível carregar esta página. Tente novamente ou volte ao menu principal.
          </p>
          <div className="flex gap-3">
            <Link href="/membro/biblia-oracao">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
