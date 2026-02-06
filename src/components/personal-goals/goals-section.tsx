'use client'

import { useState, useTransition } from 'react'
import { GoalsList } from './goals-list'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Target, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { getPersonalGoals } from '@/actions/personal-goals'
import type { PersonalGoal } from '@/lib/personal-goals-config'

interface GoalsSectionProps {
  initialGoals: PersonalGoal[]
}

export function GoalsSection({ initialGoals }: GoalsSectionProps) {
  const [goals, setGoals] = useState<PersonalGoal[]>(initialGoals)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPending, startTransition] = useTransition()

  const refreshGoals = () => {
    startTransition(async () => {
      const result = await getPersonalGoals()
      if (result.success) {
        setGoals(result.goals)
      }
    })
  }

  const pendingCount = goals.filter((g) => !g.is_completed).length

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 group"
        >
          <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Meus Alvos
            </h2>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-500 rounded-full">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={refreshGoals}
          disabled={isPending}
          className="text-muted-foreground"
        >
          <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="pl-4 border-l-2 border-amber-500/20">
          <GoalsList goals={goals} onRefresh={refreshGoals} />
        </div>
      )}
    </section>
  )
}
