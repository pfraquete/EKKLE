'use client'

import { useState } from 'react'
import { generateZoomAccessToken } from '@/actions/zoom-access'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

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
    <Button
      onClick={handleRequest}
      disabled={loading}
      className="w-full gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Gerando link...
        </>
      ) : (
        <>
          <LinkIcon className="h-5 w-5" />
          Gerar Link de Acesso
        </>
      )}
    </Button>
  )
}
