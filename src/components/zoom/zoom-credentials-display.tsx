'use client'

import { useState, useEffect } from 'react'
import { getZoomCredentials } from '@/actions/zoom-access'
import { Copy, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  serviceId: string
  token: string
}

export function ZoomCredentialsDisplay({ serviceId, token }: Props) {
  const [credentials, setCredentials] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    async function loadCredentials() {
      const result = await getZoomCredentials(serviceId, token)

      if (result.success) {
        setCredentials(result.credentials)
      } else {
        setError(result.error || 'Failed to load credentials')
      }

      setLoading(false)
    }

    loadCredentials()
  }, [serviceId, token])

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando credenciais...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <p className="mt-2 text-xs text-destructive/80">
          O link pode ter expirado (válido por 48h). Solicite um novo link de acesso.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Link de acesso válido
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-foreground">ID da Reunião</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded border border-border bg-muted px-3 py-2 text-lg font-mono text-foreground">
            {credentials.zoom_meeting_id}
          </code>
          <Button
            onClick={() => handleCopy(credentials.zoom_meeting_id, 'meeting_id')}
            size="icon"
            variant="outline"
            title="Copiar ID"
          >
            {copiedField === 'meeting_id' ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {credentials.zoom_password && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">Senha</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-border bg-muted px-3 py-2 text-lg font-mono text-foreground">
              {credentials.zoom_password}
            </code>
            <Button
              onClick={() => handleCopy(credentials.zoom_password, 'password')}
              size="icon"
              variant="outline"
              title="Copiar senha"
            >
              {copiedField === 'password' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      )}

      <Button asChild className="w-full">
        <a
          href={`https://zoom.us/j/${credentials.zoom_meeting_id}${
            credentials.zoom_password ? `?pwd=${credentials.zoom_password}` : ''
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Entrar no Zoom
        </a>
      </Button>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Este link de acesso expira em 48 horas
      </p>
    </div>
  )
}
