'use client'

import { useState, useEffect } from 'react'
import { getZoomCredentials } from '@/actions/zoom-access'
import { Copy, Loader2, CheckCircle2 } from 'lucide-react'

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
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Carregando credenciais...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm font-semibold">{error}</p>
        <p className="text-red-600 text-xs mt-2">
          O link pode ter expirado (válido por 48h). Solicite um novo link de acesso.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Link de acesso válido
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">
          ID da Reunião
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-lg font-mono">
            {credentials.zoom_meeting_id}
          </code>
          <button
            onClick={() => handleCopy(credentials.zoom_meeting_id, 'meeting_id')}
            className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
            title="Copiar ID"
          >
            {copiedField === 'meeting_id' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {credentials.zoom_password && (
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">
            Senha
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-lg font-mono">
              {credentials.zoom_password}
            </code>
            <button
              onClick={() => handleCopy(credentials.zoom_password, 'password')}
              className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
              title="Copiar senha"
            >
              {copiedField === 'password' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      )}

      <a
        href={`https://zoom.us/j/${credentials.zoom_meeting_id}${
          credentials.zoom_password ? `?pwd=${credentials.zoom_password}` : ''
        }`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-4"
      >
        Entrar no Zoom
      </a>

      <p className="text-xs text-gray-500 text-center mt-2">
        Este link de acesso expira em 48 horas
      </p>
    </div>
  )
}
