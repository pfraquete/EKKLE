'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollInCourse } from '@/actions/courses'
import { Loader2 } from 'lucide-react'

type EnrollButtonProps = {
  courseId: string
  isEnrolled: boolean
  isAuthenticated: boolean
}

export function EnrollButton({ courseId, isEnrolled, isAuthenticated }: EnrollButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')

    const result = await enrollInCourse(courseId)

    if (result.success) {
      router.push(`/membro/cursos/${courseId}`)
    } else {
      setError(result.error || 'Erro ao inscrever no curso')
      setLoading(false)
    }
  }

  if (isEnrolled) {
    return (
      <button
        onClick={() => router.push(`/membro/cursos/${courseId}`)}
        className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Continuar Curso
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? 'Inscrevendo...' : isAuthenticated ? 'Inscrever-se no Curso' : 'Criar Conta'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
