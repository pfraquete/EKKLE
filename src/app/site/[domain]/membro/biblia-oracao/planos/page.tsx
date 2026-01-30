import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Filter } from 'lucide-react'
import { getAvailablePlans, getMyActivePlan } from '@/actions/bible-reading'
import { PlanCard } from '@/components/bible/plan-card'

export default async function PlanosPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all available plans
  const plansResult = await getAvailablePlans()
  const plans = plansResult.data || []

  // Get active plan to mark it
  const activePlanResult = await getMyActivePlan()
  const activePlanId = activePlanResult.data?.plan_id

  // Group plans by duration
  const shortPlans = plans.filter(p => p.duration_days <= 30)
  const mediumPlans = plans.filter(p => p.duration_days > 30 && p.duration_days <= 90)
  const longPlans = plans.filter(p => p.duration_days > 90)

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/membro/biblia"
          className="mt-1 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            Planos de Leitura
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
            Escolha um plano que se adapte a sua rotina
          </p>
        </div>
      </div>

      {/* Short Plans (30 days or less) */}
      {shortPlans.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-green-500 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
              Planos Curtos
            </h2>
            <span className="text-xs text-muted-foreground font-medium ml-2">
              ate 30 dias
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shortPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                durationDays={plan.duration_days}
                planType={plan.plan_type}
                isActive={plan.id === activePlanId}
                href={`/membro/biblia/planos/${plan.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Medium Plans (31-90 days) */}
      {mediumPlans.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-amber-500 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
              Planos Medios
            </h2>
            <span className="text-xs text-muted-foreground font-medium ml-2">
              31 a 90 dias
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mediumPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                durationDays={plan.duration_days}
                planType={plan.plan_type}
                isActive={plan.id === activePlanId}
                href={`/membro/biblia/planos/${plan.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Long Plans (90+ days) */}
      {longPlans.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-purple-500 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
              Planos Longos
            </h2>
            <span className="text-xs text-muted-foreground font-medium ml-2">
              mais de 90 dias
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {longPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                durationDays={plan.duration_days}
                planType={plan.plan_type}
                isActive={plan.id === activePlanId}
                href={`/membro/biblia/planos/${plan.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-12 sm:py-16 lg:py-24 bg-card border border-dashed border-border rounded-2xl sm:rounded-3xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-muted rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">
            Nenhum plano disponivel
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Em breve teremos novos planos de leitura para voce
          </p>
        </div>
      )}
    </div>
  )
}
