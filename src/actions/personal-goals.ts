'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

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

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all personal goals for the current user
 */
export async function getPersonalGoals(options?: {
  category?: GoalCategory
  completed?: boolean
  limit?: number
}) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado', goals: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('personal_goals')
      .select('*')
      .eq('profile_id', profile.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.completed !== undefined) {
      query = query.eq('is_completed', options.completed)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: goals, error } = await query

    if (error) {
      console.error('Error fetching personal goals:', error)
      return { success: false, error: 'Erro ao buscar alvos', goals: [] }
    }

    return { success: true, goals: goals as PersonalGoal[] }
  } catch (error) {
    console.error('Error in getPersonalGoals:', error)
    return { success: false, error: 'Erro interno', goals: [] }
  }
}

/**
 * Get a single personal goal by ID
 */
export async function getPersonalGoal(goalId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('id', goalId)
      .eq('profile_id', profile.id)
      .single()

    if (error) {
      console.error('Error fetching personal goal:', error)
      return { success: false, error: 'Alvo não encontrado' }
    }

    return { success: true, goal: goal as PersonalGoal }
  } catch (error) {
    console.error('Error in getPersonalGoal:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Create a new personal goal
 */
export async function createPersonalGoal(input: CreateGoalInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get the max display_order
    const { data: maxOrderData } = await supabase
      .from('personal_goals')
      .select('display_order')
      .eq('profile_id', profile.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order ?? -1) + 1

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .insert({
        church_id: profile.church_id,
        profile_id: profile.id,
        title: input.title,
        description: input.description || null,
        category: input.category,
        priority: input.priority || 'MEDIA',
        target_date: input.target_date || null,
        verse_reference: input.verse_reference || null,
        verse_text: input.verse_text || null,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating personal goal:', error)
      return { success: false, error: 'Erro ao criar alvo' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true, goal: goal as PersonalGoal }
  } catch (error) {
    console.error('Error in createPersonalGoal:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Update a personal goal
 */
export async function updatePersonalGoal(goalId: string, input: UpdateGoalInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .update(input)
      .eq('id', goalId)
      .eq('profile_id', profile.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating personal goal:', error)
      return { success: false, error: 'Erro ao atualizar alvo' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true, goal: goal as PersonalGoal }
  } catch (error) {
    console.error('Error in updatePersonalGoal:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Delete a personal goal
 */
export async function deletePersonalGoal(goalId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('personal_goals')
      .delete()
      .eq('id', goalId)
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error deleting personal goal:', error)
      return { success: false, error: 'Erro ao excluir alvo' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true }
  } catch (error) {
    console.error('Error in deletePersonalGoal:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Mark a goal as completed
 */
export async function markGoalCompleted(goalId: string, notes?: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_notes: notes || null,
      })
      .eq('id', goalId)
      .eq('profile_id', profile.id)
      .select()
      .single()

    if (error) {
      console.error('Error marking goal as completed:', error)
      return { success: false, error: 'Erro ao marcar alvo como realizado' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true, goal: goal as PersonalGoal }
  } catch (error) {
    console.error('Error in markGoalCompleted:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Unmark a goal as completed (reopen)
 */
export async function reopenGoal(goalId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .update({
        is_completed: false,
        completed_at: null,
        completion_notes: null,
      })
      .eq('id', goalId)
      .eq('profile_id', profile.id)
      .select()
      .single()

    if (error) {
      console.error('Error reopening goal:', error)
      return { success: false, error: 'Erro ao reabrir alvo' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true, goal: goal as PersonalGoal }
  } catch (error) {
    console.error('Error in reopenGoal:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get goal statistics for the current user
 */
export async function getGoalStats() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: goals, error } = await supabase
      .from('personal_goals')
      .select('category, is_completed')
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error fetching goal stats:', error)
      return { success: false, error: 'Erro ao buscar estatísticas' }
    }

    const total = goals.length
    const completed = goals.filter(g => g.is_completed).length
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Group by category
    const byCategory: Record<string, { total: number; completed: number }> = {}
    for (const goal of goals) {
      if (!byCategory[goal.category]) {
        byCategory[goal.category] = { total: 0, completed: 0 }
      }
      byCategory[goal.category].total++
      if (goal.is_completed) {
        byCategory[goal.category].completed++
      }
    }

    const stats: GoalStats = {
      total_goals: total,
      completed_goals: completed,
      pending_goals: pending,
      completion_rate: completionRate,
      goals_by_category: byCategory as Record<GoalCategory, { total: number; completed: number }>,
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error in getGoalStats:', error)
    return { success: false, error: 'Erro interno' }
  }
}
