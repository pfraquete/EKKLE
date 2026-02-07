'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function BibliaOracaoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Bíblia & Oração] Error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página ou volte mais tarde.
          </p>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
