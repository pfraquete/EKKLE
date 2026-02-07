import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Flame,
  Calendar,
  Clock,
  Users,
  ListChecks,
  History,
  UserCheck,
  DoorOpen,
  Target,
} from 'lucide-react'
import { getMyActivePlan } from '@/actions/bible-reading'
import { getPrayerStreak, getPrayerStats } from '@/actions/prayers'

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

  // Get stats for the summary card
  const activePlanResult = await getMyActivePlan()
  const activePlan = activePlanResult.data

  const streakResult = await getPrayerStreak()
  const prayerStreak = streakResult.success ? streakResult.streak : null

  const weeklyStatsResult = await getPrayerStats('week')
  const weeklyStats = weeklyStatsResult.success ? weeklyStatsResult.stats : null

  const progressPercent = activePlan
    ? Math.round((activePlan.progress.length / activePlan.totalReadings) * 100)
    : 0

  const menuItems = [
    {
      href: '/membro/biblia-oracao/oracao',
      icon: Flame,
      label: 'Oração',
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
    },
    {
      href: '/membro/biblia-oracao/leitor',
      icon: BookOpen,
      label: 'Ler Bíblia',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
    },
    {
      href: '/membro/biblia-oracao/planos',
      icon: ListChecks,
      label: 'Planos de Leitura',
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
    },
    {
      href: '/membro/biblia-oracao/alvos',
      icon: Target,
      label: 'Meus Alvos',
      color: 'text-pink-400',
      bg: 'bg-pink-500/15',
    },
    {
      href: '/membro/biblia-oracao/oracao/nova',
      icon: Flame,
      label: 'Nova Oração',
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
    },
    {
      href: '/membro/biblia-oracao/oracao/historico',
      icon: History,
      label: 'Histórico',
      color: 'text-purple-400',
      bg: 'bg-purple-500/15',
    },
    {
      href: '/membro/biblia-oracao/oracao/parceiro',
      icon: UserCheck,
      label: 'Parceiro de Oração',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15',
    },
    {
      href: '/membro/biblia-oracao/oracao/salas',
      icon: DoorOpen,
      label: 'Salas de Oração',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15',
    },
  ]

  // Add "Meu Plano" only if there's an active plan
  if (activePlan) {
    menuItems.splice(3, 0, {
      href: '/membro/biblia-oracao/meu-plano',
      icon: Calendar,
      label: 'Meu Plano',
      color: 'text-teal-400',
      bg: 'bg-teal-500/15',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Bíblia e Oração
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Sua jornada espiritual diária
        </p>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Resumo Semanal</p>
            <p className="text-lg font-black mt-0.5">
              {activePlan ? activePlan.plan.name : 'Comece um plano'}
            </p>
          </div>
          {prayerStreak && prayerStreak.current_streak > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
              <Flame className="w-4 h-4 fill-orange-300 text-orange-300" />
              <span className="text-sm font-black">{prayerStreak.current_streak}d</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              <span className="text-lg font-black">{weeklyStats?.totalPrayers ?? 0}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Orações</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span className="text-lg font-black">{weeklyStats?.totalMinutes ?? 0}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Minutos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Users className="w-3.5 h-3.5 opacity-80" />
              <span className="text-lg font-black">{weeklyStats?.peoplePrayed ?? 0}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Pessoas</p>
          </div>
        </div>

        {activePlan && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold opacity-80">Progresso</span>
              <span className="text-xs font-black">
                {activePlan.progress.length}/{activePlan.totalReadings} dias
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:bg-accent/50 transition-all active:scale-95"
          >
            <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="text-xs font-bold text-foreground text-center leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
