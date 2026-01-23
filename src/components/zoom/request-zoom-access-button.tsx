'use client'

import { useState } from 'react'
import { generateZoomAccessToken } from '@/actions/zoom-access'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  serviceId: string
}

export function RequestZoomAccessButton({ serviceId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRequest() {
    setLoading(true)

    const result = await generateZoomAccessToken(serviceId)

    if (result.success && result.token) {
      // Redirecionar para mesma página com token na URL
      const url = new URL(window.location.href)
      url.searchParams.set('token', result.token)
      router.push(url.pathname + url.search)
      router.refresh()
    } else {
      alert('Erro ao gerar link de acesso. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Gerando link...
        </>
      ) : (
        <>
          <LinkIcon className="w-5 h-5" />
          Gerar Link de Acesso
        </>
      )}
    </button>
  )
}
