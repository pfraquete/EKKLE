import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mic, History, BarChart3, Plus, Video, Users } from 'lucide-react'
import { getPrayerHistory, getPrayerStreak, getPrayerStats } from '@/actions/prayers'
import { PrayerHistoryItem, StreakDisplay, PrayerStatsCard } from '@/components/prayers'
import { Button } from '@/components/ui/button'

export default async function EkkleOracaoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get prayer data
  const [historyResult, streakResult, weeklyStatsResult] = await Promise.all([
    getPrayerHistory(1, 5),
    getPrayerStreak(),
    getPrayerStats('week'),
  ])

  const prayers = historyResult.success ? historyResult.prayers : []
  const streak = streakResult.success ? streakResult.streak : null
  const weeklyStats = weeklyStatsResult.success ? weeklyStatsResult.stats : null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Oracao
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Seu diario de oracao pessoal
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
        <Link href="/ekkle/membro/biblia-oracao/oracao/nova" className="col-span-2">
          <Button className="w-full py-8 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl">
            <Mic className="w-6 h-6 mr-3" />
            Gravar Nova Oracao
          </Button>
        </Link>
        <Link href="/ekkle/membro/biblia-oracao/oracao/parceiro">
          <Button variant="outline" className="w-full py-8 rounded-2xl">
            <Users className="w-5 h-5 mr-2" />
            Parceiro
          </Button>
        </Link>
        <Link href="/ekkle/membro/biblia-oracao/oracao/salas">
          <Button variant="outline" className="w-full py-8 rounded-2xl">
            <Video className="w-5 h-5 mr-2" />
            Salas
          </Button>
        </Link>
        <Link href="/ekkle/membro/biblia-oracao/oracao/relatorios" className="col-span-2 sm:col-span-4">
          <Button variant="ghost" className="w-full py-4 rounded-2xl text-muted-foreground">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Relatorios
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

      {/* Recent Prayers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Oracoes Recentes
            </h2>
          </div>
          <Link
            href="/ekkle/membro/biblia-oracao/oracao/historico"
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
                href={`/ekkle/membro/biblia-oracao/oracao/${prayer.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
            <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Nenhuma oracao ainda
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Comece a gravar suas oracoes para criar um diario espiritual e acompanhar suas peticoes
            </p>
            <Link href="/ekkle/membro/biblia-oracao/oracao/nova">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Gravar Primeira Oracao
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
