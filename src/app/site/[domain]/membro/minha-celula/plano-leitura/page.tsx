'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Users, Plus, Loader2, Play, UserPlus } from 'lucide-react'
import {
  getCellGroupPlan,
  joinGroupPlan,
  getGroupMembersProgress,
  getPlanDetails,
  markGroupReadingComplete
} from '@/actions/bible-reading'
import type { GroupPlan, ReadingPlan, GroupMember, PlanReading } from '@/actions/bible-reading'
import { getBookName } from '@/lib/bible-utils'
import { StreakDisplay } from '@/components/bible/streak-display'
import { GroupProgress } from '@/components/bible/group-progress'
import { CreateGroupDialog } from '@/components/bible/create-group-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function PlanoLeituraGrupoPage() {
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [groupPlan, setGroupPlan] = useState<(GroupPlan & {
    plan: ReadingPlan
    members: GroupMember[]
    myMembership: GroupMember | null
    totalReadings: number
  }) | null>(null)
  const [membersProgress, setMembersProgress] = useState<Array<{
    member: GroupMember
    completedCount: number
    progressPercent: number
  }>>([])
  const [readings, setReadings] = useState<PlanReading[]>([])
  const [completedReadings, setCompletedReadings] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [cellInfo, setCellInfo] = useState<{ id: string; name: string } | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setCurrentUserId(user.id)

      // Get user's cell info
      const { data: profile } = await supabase
        .from('profiles')
        .select('cell_id')
        .eq('id', user.id)
        .single()

      if (profile?.cell_id) {
        const { data: cell } = await supabase
          .from('cells')
          .select('id, name, leader_id')
          .eq('id', profile.cell_id)
          .single()

        if (cell) {
          setCellInfo({ id: cell.id, name: cell.name })
          setIsLeader(cell.leader_id === user.id)
        }
      }
    }

    const result = await getCellGroupPlan()

    if (result.success && result.data) {
      setGroupPlan(result.data)

      // Load readings
      const planDetails = await getPlanDetails(result.data.plan_id)
      if (planDetails.success && planDetails.data) {
        setReadings(planDetails.data.readings)
      }

      // Load members progress
      const progressResult = await getGroupMembersProgress(result.data.id)
      if (progressResult.success && progressResult.data) {
        setMembersProgress(progressResult.data)
      }

      // Load my completed readings
      if (result.data.myMembership) {
        const { data: myProgress } = await supabase
          .from('group_reading_progress')
          .select('reading_id')
          .eq('member_id', result.data.myMembership.id)

        if (myProgress) {
          setCompletedReadings(new Set(myProgress.map(p => p.reading_id)))
        }
      }
    }

    setLoading(false)
  }

  const handleJoin = async () => {
    if (!groupPlan) return

    setJoining(true)
    const result = await joinGroupPlan(groupPlan.id)

    if (result.success) {
      toast.success('Voce entrou no plano de leitura!')
      loadData()
    } else {
      toast.error(result.error || 'Erro ao entrar no plano')
    }

    setJoining(false)
  }

  const handleMarkComplete = async (readingId: string) => {
    const result = await markGroupReadingComplete(readingId)

    if (result.success) {
      toast.success('Leitura concluida!')
      setCompletedReadings(prev => new Set([...prev, readingId]))
      loadData()
    } else {
      toast.error(result.error || 'Erro ao marcar leitura')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cellInfo) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Voce nao pertence a uma celula</h2>
        <p className="text-muted-foreground">
          Entre em contato com seu lider para participar de uma celula
        </p>
      </div>
    )
  }

  if (!groupPlan) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link
            href="/membro/minha-celula"
            className="mt-1 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              Plano de Leitura
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
              Celula {cellInfo.name}
            </p>
          </div>
        </div>

        {/* No Plan State */}
        <div className="text-center py-12 sm:py-16 bg-card border border-dashed border-border rounded-2xl sm:rounded-3xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">
            Nenhum plano ativo
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6 max-w-md mx-auto px-4">
            {isLeader
              ? 'Crie um plano de leitura para sua celula acompanharem juntos'
              : 'Aguarde seu lider criar um plano de leitura para a celula'
            }
          </p>

          {isLeader && (
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Criar Plano de Grupo
            </Button>
          )}
        </div>

        {/* Create Dialog */}
        {cellInfo && (
          <CreateGroupDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            cellId={cellInfo.id}
            cellName={cellInfo.name}
          />
        )}
      </div>
    )
  }

  const myProgress = membersProgress.find(m => m.member.profile_id === currentUserId)
  const myProgressPercent = myProgress?.progressPercent || 0
  const isMember = !!groupPlan.myMembership

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/membro/minha-celula"
          className="mt-1 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {cellInfo.name}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {groupPlan.name || groupPlan.plan.name}
          </h1>
        </div>
      </div>

      {/* Join Button if not member */}
      {!isMember && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Participe do plano da celula</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Junte-se aos irmaos nesta jornada de leitura biblica
          </p>
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Participar do Plano
          </Button>
        </div>
      )}

      {/* My Progress (if member) */}
      {isMember && groupPlan.myMembership && (
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs sm:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                Seu Progresso
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Dia {groupPlan.myMembership.current_day} de {groupPlan.totalReadings}
              </h2>
            </div>
            <StreakDisplay
              streak={groupPlan.myMembership.current_streak}
              size="md"
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-primary">{myProgressPercent}%</span>
            </div>
            <Progress value={myProgressPercent} className="h-2.5" />
          </div>
        </div>
      )}

      {/* Group Progress */}
      <GroupProgress
        members={membersProgress}
        currentUserId={currentUserId || undefined}
      />

      {/* Readings List (if member) */}
      {isMember && readings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-primary rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
              Leituras
            </h2>
          </div>

          <div className="space-y-2">
            {readings.slice(0, 10).map((reading) => {
              const isCompleted = completedReadings.has(reading.id)
              const isCurrent = reading.day_number === (groupPlan.myMembership?.current_day || 1)

              const reference = reading.chapter_end && reading.chapter_end !== reading.chapter_start
                ? `${getBookName(reading.book_id)} ${reading.chapter_start}-${reading.chapter_end}`
                : `${getBookName(reading.book_id)} ${reading.chapter_start}`

              return (
                <div
                  key={reading.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : isCurrent
                        ? 'bg-primary/5 border-primary'
                        : 'bg-card border-border/50'
                  }`}
                >
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
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

                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant={isCurrent ? 'default' : 'outline'}
                      onClick={() => handleMarkComplete(reading.id)}
                    >
                      Concluir
                    </Button>
                  )}

                  {isCompleted && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Lido
                    </Badge>
                  )}
                </div>
              )
            })}

            {readings.length > 10 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                + {readings.length - 10} leituras restantes
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
