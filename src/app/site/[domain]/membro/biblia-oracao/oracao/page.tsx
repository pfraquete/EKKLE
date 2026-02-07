import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mic, History, Plus, Video, Users } from 'lucide-react'
import { getPrayerHistory, getPrayerStreak, getPrayerStats } from '@/actions/prayers'
import { getPersonalGoals } from '@/actions/personal-goals'
import { PrayerHistoryItem, StreakDisplay, PrayerStatsCard } from '@/components/prayers'
import { GoalsSection } from '@/components/personal-goals'
import { Button } from '@/components/ui/button'

export default async function OracaoPage() {
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

  // Get prayer data and personal goals
  const [historyResult, streakResult, weeklyStatsResult, goalsResult] = await Promise.all([
    getPrayerHistory(1, 5),
    getPrayerStreak(),
    getPrayerStats('week'),
    getPersonalGoals(),
  ])

  const prayers = historyResult.success ? historyResult.prayers : []
  const streak = streakResult.success ? streakResult.streak : null
  const weeklyStats = weeklyStatsResult.success ? weeklyStatsResult.stats : null
  const goals = goalsResult.success ? goalsResult.goals : []

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Oração
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Seu diário de oração pessoal
          </p>
        </div>

        {streak && (
          <StreakDisplay
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
            size="md"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/membro/biblia-oracao/oracao/nova" className="col-span-2">
          <Button className="w-full py-8 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl">
            <Mic className="w-6 h-6 mr-3" />
            Gravar Nova Oração
          </Button>
        </Link>
        <Link href="/membro/biblia-oracao/oracao/parceiro">
          <Button variant="outline" className="w-full py-8 rounded-2xl">
            <Users className="w-5 h-5 mr-2" />
            Parceiro
          </Button>
        </Link>
        <Link href="/membro/biblia-oracao/oracao/salas">
          <Button variant="outline" className="w-full py-8 rounded-2xl">
            <Video className="w-5 h-5 mr-2" />
            Salas
          </Button>
        </Link>
      </div>

      {/* Weekly Stats */}
      {weeklyStats && (
        <PrayerStatsCard
          stats={{
            totalPrayers: weeklyStats.totalPrayers,
            totalMinutes: weeklyStats.totalMinutes,
            peoplePrayed: weeklyStats.peoplePrayed,
            answeredPrayers: weeklyStats.answeredPrayers,
            currentStreak: streak?.current_streak,
          }}
          period="week"
        />
      )}

      {/* Personal Goals Section */}
      <GoalsSection initialGoals={goals} />

      {/* Recent Prayers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Orações Recentes
            </h2>
          </div>
          <Link
            href="/membro/biblia-oracao/oracao/historico"
            className="text-primary text-sm font-bold flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            Ver Tudo
          </Link>
        </div>

        {prayers && prayers.length > 0 ? (
          <div className="space-y-3">
            {prayers.map((prayer) => (
              <PrayerHistoryItem
                key={prayer.id}
                prayer={prayer}
                href={`/membro/biblia-oracao/oracao/${prayer.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
            <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Nenhuma oração ainda
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Comece a gravar suas orações para criar um diário espiritual e acompanhar suas petições
            </p>
            <Link href="/membro/biblia-oracao/oracao/nova">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Gravar Primeira Oração
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
