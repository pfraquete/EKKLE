'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, Flame, Pause, Play, Loader2, CheckCircle } from 'lucide-react'
import { getMyActivePlan, pauseReadingPlan, resumeReadingPlan, getPlanDetails } from '@/actions/bible-reading'
import type { UserPlan, ReadingPlan, PlanReading, ReadingProgress } from '@/actions/bible-reading'
import { StreakDisplay } from '@/components/bible/streak-display'
import { ReadingListItem } from '@/components/bible/reading-list-item'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function MeuPlanoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState(false)
  const [userPlan, setUserPlan] = useState<(UserPlan & {
    plan: ReadingPlan
    progress: ReadingProgress[]
    totalReadings: number
  }) | null>(null)
  const [readings, setReadings] = useState<PlanReading[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getMyActivePlan()

    if (result.success && result.data) {
      setUserPlan(result.data)

      // Load all readings
      const planDetails = await getPlanDetails(result.data.plan_id)
      if (planDetails.success && planDetails.data) {
        setReadings(planDetails.data.readings)
      }
    }

    setLoading(false)
  }

  const handlePause = async () => {
    setActionPending(true)
    const result = await pauseReadingPlan()
    if (result.success) {
      toast.success('Plano pausado')
      router.push('/membro/biblia-oracao')
    } else {
      toast.error(result.error || 'Erro ao pausar')
    }
    setActionPending(false)
  }

  const handleResume = async () => {
    setActionPending(true)
    const result = await resumeReadingPlan()
    if (result.success) {
      toast.success('Plano retomado!')
      loadData()
    } else {
      toast.error(result.error || 'Erro ao retomar')
    }
    setActionPending(false)
  }

  const handleComplete = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userPlan) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <BookOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Nenhum plano ativo</h2>
        <p className="text-muted-foreground mb-4">
          Voce ainda nao iniciou nenhum plano de leitura
        </p>
        <Link
          href="/membro/biblia-oracao/planos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Play className="w-4 h-4" />
          Explorar Planos
        </Link>
      </div>
    )
  }

  const completedIds = new Set(userPlan.progress.map(p => p.reading_id))
  const progressPercent = Math.round((userPlan.progress.length / userPlan.totalReadings) * 100)

  // Calculate current day based on start date
  const startDate = new Date(userPlan.start_date)
  const today = new Date()
  const diffTime = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  const currentDay = Math.max(1, Math.min(diffDays, userPlan.current_day))

  const isPaused = userPlan.status === 'PAUSED'

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/membro/biblia-oracao"
          className="mt-1 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Meu Plano
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {userPlan.plan.name}
          </h1>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <StreakDisplay
            streak={userPlan.current_streak}
            longestStreak={userPlan.longest_streak}
            size="lg"
          />

          <Button
            variant={isPaused ? 'default' : 'outline'}
            onClick={isPaused ? handleResume : handlePause}
            disabled={actionPending}
          >
            {actionPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : isPaused ? (
              <Play className="w-4 h-4 mr-2" />
            ) : (
              <Pause className="w-4 h-4 mr-2" />
            )}
            {isPaused ? 'Retomar' : 'Pausar'}
          </Button>
        </div>

        {/* Progress */}
        <div className="bg-muted/30 p-4 rounded-xl sm:rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Progresso
            </span>
            <span className="text-sm font-black text-primary">
              {userPlan.progress.length} / {userPlan.totalReadings}
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {progressPercent}% concluido
            </p>
            <p className="text-xs text-muted-foreground">
              {userPlan.totalReadings - userPlan.progress.length} restantes
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-primary mb-0.5">
            {userPlan.progress.length}
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Lidos
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-orange-500 mb-0.5 flex items-center justify-center gap-0.5">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-400" />
            {userPlan.current_streak}
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Sequencia
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-muted-foreground mb-0.5">
            {userPlan.longest_streak}
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Recorde
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-muted-foreground mb-0.5">
            {currentDay}
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Dia Atual
          </p>
        </div>
      </div>

      {/* Readings List */}
      <section>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-primary rounded-full" />
          <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
            Leituras
          </h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {userPlan.progress.length} de {readings.length}
          </span>
        </div>

        <div className="space-y-2">
          {readings.map((reading) => {
            const isCompleted = completedIds.has(reading.id)
            const isCurrent = reading.day_number === currentDay

            return (
              <ReadingListItem
                key={reading.id}
                readingId={reading.id}
                dayNumber={reading.day_number}
                bookId={reading.book_id}
                chapterStart={reading.chapter_start}
                chapterEnd={reading.chapter_end}
                readingTitle={reading.reading_title}
                isCompleted={isCompleted}
                isCurrent={isCurrent && !isCompleted}
                onComplete={handleComplete}
              />
            )
          })}
        </div>
      </section>

      {/* Completed Message */}
      {progressPercent === 100 && (
        <div className="text-center py-8 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-700 mb-1">
            Parabens! Voce completou o plano!
          </h3>
          <p className="text-green-600">
            Sua jornada de leitura foi concluida com sucesso
          </p>
        </div>
      )}
    </div>
  )
}
