'use client'

import { useState } from 'react'
import { enrollInCourse } from '@/actions/courses'
import { useChurchNavigation } from '@/hooks/use-church-navigation'
import { Loader2 } from 'lucide-react'

type EnrollButtonProps = {
  courseId: string
  isEnrolled: boolean
  isAuthenticated: boolean
  isEnrollmentOpen?: boolean
}

export function EnrollButton({ courseId, isEnrolled, isAuthenticated, isEnrollmentOpen = true }: EnrollButtonProps) {
  const { push } = useChurchNavigation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      push('/login')
      return
    }

    if (!isEnrollmentOpen) {
      setError('As inscrições ainda não estão abertas.')
      return
    }

    setLoading(true)
    setError('')

    const result = await enrollInCourse(courseId)

    if (result.success) {
      push(`/membro/cursos/${courseId}`)
    } else {
      setError(result.error || 'Erro ao inscrever no curso')
      setLoading(false)
    }
  }

  if (isEnrolled) {
    return (
      <button
        onClick={() => push(`/membro/cursos/${courseId}`)}
        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
      >
        Continuar Curso
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={loading || !isEnrollmentOpen}
        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
