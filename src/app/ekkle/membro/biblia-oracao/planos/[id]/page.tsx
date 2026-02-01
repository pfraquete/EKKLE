'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Calendar, Clock, Loader2, Play, List } from 'lucide-react'
import { getPlanDetails, getMyActivePlan } from '@/actions/bible-reading'
import type { ReadingPlan, PlanReading } from '@/actions/bible-reading'
import { getBookName } from '@/lib/bible-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StartPlanDialog } from '@/components/bible/start-plan-dialog'

interface PlanDetailsPageProps {
  params: Promise<{ id: string }>
}

const planTypeLabels = {
  SEQUENTIAL: 'Sequencial',
  THEMATIC: 'Tematico',
  CHRONOLOGICAL: 'Cronologico'
}

export default function EkklePlanDetailsPage({ params }: PlanDetailsPageProps) {
  const router = useRouter()
  const [planId, setPlanId] = useState<string | null>(null)
  const [plan, setPlan] = useState<(ReadingPlan & { readings: PlanReading[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [isActivePlan, setIsActivePlan] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)

  useEffect(() => {
    params.then(p => setPlanId(p.id))
  }, [params])

  useEffect(() => {
    if (planId) {
      loadData()
    }
  }, [planId])

  const loadData = async () => {
    if (!planId) return

    setLoading(true)

    const [planResult, activePlanResult] = await Promise.all([
      getPlanDetails(planId),
      getMyActivePlan()
    ])

    if (planResult.success && planResult.data) {
      setPlan(planResult.data)
    }

    if (activePlanResult.success && activePlanResult.data) {
      setHasActivePlan(true)
      setIsActivePlan(activePlanResult.data.plan_id === planId)
    }

    setLoading(false)
  }

  const getDurationLabel = (days: number) => {
    if (days === 365) return '1 ano'
    if (days >= 30) return `${Math.round(days / 30)} ${days >= 60 ? 'meses' : 'mes'}`
    return `${days} dias`
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <BookOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Plano nao encontrado</h2>
        <Link href="/ekkle/membro/biblia-oracao/planos" className="text-primary hover:underline">
          Voltar para planos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/ekkle/membro/biblia-oracao/planos"
          className="mt-1 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {getDurationLabel(plan.duration_days)}
            </Badge>
            <Badge variant="outline">
              {planTypeLabels[plan.plan_type]}
            </Badge>
            {isActivePlan && (
              <Badge variant="default">
                Seu Plano Atual
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {plan.name}
          </h1>
          {plan.description && (
            <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
              {plan.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-3">
        {isActivePlan ? (
          <Button asChild className="flex-1" size="lg">
            <Link href="/ekkle/membro/biblia-oracao/meu-plano">
              <Play className="w-4 h-4 mr-2" />
              Continuar Leitura
            </Link>
          </Button>
        ) : hasActivePlan ? (
          <div className="flex-1 p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Voce ja possui um plano ativo. Pause ou complete o atual para iniciar este.
            </p>
            <Link
              href="/ekkle/membro/biblia-oracao/meu-plano"
              className="text-primary text-sm font-medium hover:underline mt-2 inline-block"
            >
              Ver meu plano
            </Link>
          </div>
        ) : (
          <Button
            onClick={() => setShowStartDialog(true)}
            className="flex-1"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Comecar este Plano
          </Button>
        )}
      </div>

      {/* Plan Overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-primary mb-1">
            {plan.duration_days}
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Dias
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-foreground mb-1">
            {plan.readings.length}
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Leituras
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-muted-foreground mb-1">
            ~10
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Min/dia
          </p>
        </div>
      </div>

      {/* Readings List */}
      <section>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-muted-foreground/30 rounded-full" />
          <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
            Leituras do Plano
          </h2>
          <List className="w-5 h-5 text-muted-foreground ml-auto" />
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
            {plan.readings.map((reading) => {
              const reference = reading.chapter_end && reading.chapter_end !== reading.chapter_start
                ? `${getBookName(reading.book_id)} ${reading.chapter_start}-${reading.chapter_end}`
                : `${getBookName(reading.book_id)} ${reading.chapter_start}`

              return (
                <div
                  key={reading.id}
                  className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {reading.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{reference}</p>
                    {reading.reading_title && (
                      <p className="text-sm text-muted-foreground truncate">
                        {reading.reading_title}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Start Plan Dialog */}
      <StartPlanDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        planId={plan.id}
        planName={plan.name}
        durationDays={plan.duration_days}
        redirectPath="/ekkle/membro/biblia-oracao/meu-plano"
      />
    </div>
  )
}
