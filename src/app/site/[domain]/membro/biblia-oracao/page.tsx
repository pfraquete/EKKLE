import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Flame, ArrowRight, Calendar, CheckCircle, Play, Mic, Clock, Users, Sparkles } from 'lucide-react'
import { getMyActivePlan, getTodaysReading, getAvailablePlans } from '@/actions/bible-reading'
import { getPrayerStreak, getPrayerStats } from '@/actions/prayers'
import { TodaysReadingCard } from '@/components/bible/todays-reading-card'
import { StreakDisplay } from '@/components/bible/streak-display'
import { StreakDisplay as PrayerStreakDisplay } from '@/components/prayers/streak-display'
import { PlanCard } from '@/components/bible/plan-card'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function BibliaOracaoPage() {
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

  // Get active plan
  const activePlanResult = await getMyActivePlan()
  const activePlan = activePlanResult.data

  // Get today's reading if has active plan
  let todaysReading = null
  if (activePlan) {
    const todaysResult = await getTodaysReading()
    if (todaysResult.success && todaysResult.data) {
      todaysReading = todaysResult.data
    }
  }

  // Get available plans for suggestions
  const plansResult = await getAvailablePlans()
  const availablePlans = plansResult.data?.slice(0, 3) || []

  // Get prayer stats
  const streakResult = await getPrayerStreak()
  const prayerStreak = streakResult.success ? streakResult.streak : null

  const weeklyStatsResult = await getPrayerStats('week')
  const weeklyStats = weeklyStatsResult.success ? weeklyStatsResult.stats : null

  // Calculate progress
  const progressPercent = activePlan
    ? Math.round((activePlan.progress.length / activePlan.totalReadings) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">Biblia e Oracao</h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
          Sua jornada espiritual diaria
        </p>
      </div>

      {/* Prayer Quick Actions */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">
              Oracao
            </p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">
              Converse com Deus
            </h2>
          </div>
          {prayerStreak && (
            <PrayerStreakDisplay
              currentStreak={prayerStreak.current_streak}
              longestStreak={prayerStreak.longest_streak}
              size="md"
            />
          )}
        </div>

        {/* Prayer Stats */}
        {weeklyStats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-background/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-lg font-black">{weeklyStats.totalPrayers}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Esta Semana
              </p>
            </div>
            <div className="bg-background/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-black">{weeklyStats.totalMinutes}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Minutos
              </p>
            </div>
            <div className="bg-background/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-lg font-black">{weeklyStats.peoplePrayed}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Pessoas
              </p>
            </div>
          </div>
        )}

        {/* Prayer Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/membro/biblia-oracao/oracao/nova">
            <Button className="w-full py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Mic className="w-5 h-5 mr-2" />
              Gravar Nova Oracao
            </Button>
          </Link>
          <Link href="/membro/biblia-oracao/oracao">
            <Button variant="outline" className="w-full py-6">
              <BookOpen className="w-5 h-5 mr-2" />
              Ver Historico
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-primary/10">
          <Link
            href="/membro/biblia-oracao/oracao/relatorios"
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Relatorios
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Leitura Biblica
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Active Plan Section */}
      {activePlan ? (
        <>
          {/* Plan Overview Card */}
          <section className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Plano Atual
                </p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">
                  {activePlan.plan.name}
                </h2>
              </div>
              <StreakDisplay
                streak={activePlan.current_streak}
                longestStreak={activePlan.longest_streak}
                size="md"
              />
            </div>

            {/* Progress */}
            <div className="bg-muted/30 p-4 rounded-xl sm:rounded-2xl border border-border/50 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Progresso Geral
                </span>
                <span className="text-sm font-black text-primary">
                  {activePlan.progress.length} / {activePlan.totalReadings} dias
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-2">
                {progressPercent}% concluido
              </p>
            </div>

            <Link
              href="/membro/biblia-oracao/meu-plano"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-colors"
            >
              Ver Plano Completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Today's Reading */}
          {todaysReading && (
            <section>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-primary rounded-full" />
                <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
                  Leitura de Hoje
                </h2>
              </div>

              <TodaysReadingCard
                readingId={todaysReading.reading.id}
                dayNumber={todaysReading.dayNumber}
                bookId={todaysReading.reading.book_id}
                chapterStart={todaysReading.reading.chapter_start}
                chapterEnd={todaysReading.reading.chapter_end}
                readingTitle={todaysReading.reading.reading_title}
                isCompleted={todaysReading.isCompleted}
              />
            </section>
          )}
        </>
      ) : (
        <>
          {/* No Active Plan - CTA */}
          <section className="text-center py-8 sm:py-12 lg:py-16 bg-card border border-dashed border-border rounded-2xl sm:rounded-3xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">
              Comece sua Jornada Biblica
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6 max-w-md mx-auto px-4">
              Escolha um plano de leitura e desenvolva o habito diario de ler a Palavra de Deus
            </p>
            <Link
              href="/membro/biblia-oracao/planos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Explorar Planos
            </Link>
          </section>

          {/* Available Plans Preview */}
          {availablePlans.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-muted-foreground/30 rounded-full" />
                  <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
                    Planos Disponiveis
                  </h2>
                </div>
                <Link
                  href="/membro/biblia-oracao/planos"
                  className="text-primary text-xs sm:text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    id={plan.id}
                    name={plan.name}
                    description={plan.description}
                    durationDays={plan.duration_days}
                    planType={plan.plan_type}
                    href={`/membro/biblia-oracao/planos/${plan.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Quick Stats */}
      {activePlan && (
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-primary mb-1">
              {activePlan.progress.length}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dias Lidos
            </p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-orange-500 mb-1 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-orange-400" />
              {activePlan.current_streak}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sequencia
            </p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-muted-foreground mb-1">
              {activePlan.totalReadings - activePlan.progress.length}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Restantes
            </p>
          </div>
        </section>
      )}

      {/* Browse Plans Link */}
      {activePlan && (
        <div className="text-center pt-4">
          <Link
            href="/membro/biblia-oracao/planos"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Explorar outros planos de leitura
          </Link>
        </div>
      )}
    </div>
  )
}
