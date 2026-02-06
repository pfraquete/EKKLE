// Types
export type GoalCategory = 
  | 'ESPIRITUAL'
  | 'FAMILIAR'
  | 'PROFISSIONAL'
  | 'FINANCEIRO'
  | 'SAUDE'
  | 'MINISTERIAL'
  | 'EDUCACIONAL'
  | 'OUTRO'

export type GoalPriority = 'ALTA' | 'MEDIA' | 'BAIXA'

export interface PersonalGoal {
  id: string
  church_id: string
  profile_id: string
  title: string
  description: string | null
  category: GoalCategory
  priority: GoalPriority
  target_date: string | null
  is_completed: boolean
  completed_at: string | null
  completion_notes: string | null
  verse_reference: string | null
  verse_text: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface GoalStats {
  total_goals: number
  completed_goals: number
  pending_goals: number
  completion_rate: number
  goals_by_category: Record<GoalCategory, { total: number; completed: number }>
}

export interface CreateGoalInput {
  title: string
  description?: string
  category: GoalCategory
  priority?: GoalPriority
  target_date?: string
  verse_reference?: string
  verse_text?: string
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  category?: GoalCategory
  priority?: GoalPriority
  target_date?: string | null
  verse_reference?: string | null
  verse_text?: string | null
  display_order?: number
}

// Category configuration for UI
export const categoryConfig: Record<GoalCategory, { label: string; icon: string; color: string; bgColor: string }> = {
  ESPIRITUAL: {
    label: 'Espiritual',
    icon: 'Sparkles',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  FAMILIAR: {
    label: 'Familiar',
    icon: 'Heart',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  PROFISSIONAL: {
    label: 'Profissional',
    icon: 'Briefcase',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  FINANCEIRO: {
    label: 'Financeiro',
    icon: 'Wallet',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  SAUDE: {
    label: 'Saúde',
    icon: 'HeartPulse',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  MINISTERIAL: {
    label: 'Ministerial',
    icon: 'Church',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  EDUCACIONAL: {
    label: 'Educacional',
    icon: 'GraduationCap',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  OUTRO: {
    label: 'Outro',
    icon: 'Target',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
}

export const priorityConfig: Record<GoalPriority, { label: string; color: string; bgColor: string }> = {
  ALTA: {
    label: 'Alta',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  MEDIA: {
    label: 'Média',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  BAIXA: {
    label: 'Baixa',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
}
