'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface MemoryVerse {
  id: string
  church_id: string
  reference: string
  text: string
  translation: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  target_age_min: number
  target_age_max: number
  category: string | null
  is_active: boolean
  order_index: number
  created_at: string
}

export interface ChildMemorizedVerse {
  id: string
  child_id: string
  verse_id: string
  memorized_at: string
  verified_by: string | null
  verified_at: string | null
  points_earned: number
  attempts: number
  notes: string | null
  verse?: MemoryVerse
  verified_by_profile?: { full_name: string }
}

export interface Badge {
  id: string
  church_id: string
  name: string
  description: string | null
  icon_name: string
  color: string
  category: 'verses' | 'attendance' | 'activities' | 'formation' | 'special'
  requirement_type: 'count' | 'streak' | 'milestone' | 'manual'
  requirement_value: number | null
  points_value: number
  is_active: boolean
  order_index: number
}

export interface ChildBadge {
  id: string
  child_id: string
  badge_id: string
  earned_at: string
  awarded_by: string | null
  notes: string | null
  badge?: Badge
  awarded_by_profile?: { full_name: string }
}

export interface DiscipleActivity {
  id: string
  church_id: string
  name: string
  description: string | null
  icon_name: string
  color: string
  points: number
  is_daily: boolean
  is_active: boolean
  order_index: number
}

export interface ChildActivity {
  id: string
  child_id: string
  activity_id: string
  completed_at: string
  completed_date: string
  points_earned: number
  notes: string | null
  activity?: DiscipleActivity
}

export interface Level {
  id: string
  church_id: string
  name: string
  description: string | null
  icon_name: string
  color: string
  min_points: number
  max_points: number | null
  order_index: number
}

export interface PointsLog {
  id: string
  child_id: string
  points: number
  reason: string
  source_type: 'verse' | 'badge' | 'activity' | 'attendance' | 'bonus' | 'manual'
  source_id: string | null
  awarded_by: string | null
  created_at: string
  awarded_by_profile?: { full_name: string }
}

export interface GamificationStats {
  totalPoints: number
  totalVerses: number
  totalBadges: number
  totalActivities: number
  currentStreak: number
  bestStreak: number
  currentLevel: Level | null
  nextLevel: Level | null
  pointsToNextLevel: number
}

// =====================================================
// HELPER: Check Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTOR']) {
  const profile = await getProfile()
  if (!profile) {
    return { error: 'Não autenticado', profile: null }
  }

  if (profile.role === 'PASTOR') {
    return { error: null, profile }
  }

  if (requiredRoles.includes(profile.kids_role || '')) {
    return { error: null, profile }
  }

  return { error: 'Sem permissão para esta ação', profile: null }
}

// =====================================================
// VERSÍCULOS
// =====================================================

export async function getMemoryVerses(): Promise<MemoryVerse[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_memory_verses')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching verses:', error)
    return []
  }

  return data as MemoryVerse[]
}

export async function createMemoryVerse(data: {
  reference: string
  text: string
  translation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  points?: number
  category?: string
  target_age_min?: number
  target_age_max?: number
}) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR', 'PASTORA_KIDS'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { data: verse, error } = await supabase
      .from('kids_memory_verses')
      .insert({
        ...data,
        church_id: profile.church_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating verse:', error)
      return { success: false, error: 'Erro ao criar versículo' }
    }

    revalidatePath('/rede-kids')
    return { success: true, data: verse }
  } catch (error) {
    console.error('Error in createMemoryVerse:', error)
    return { success: false, error: 'Erro ao criar versículo' }
  }
}

export async function markVerseAsMemorized(childId: string, verseId: string, notes?: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR', 'PASTORA_KIDS', 'DISCIPULADORA_KIDS', 'LEADER_KIDS'
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_child_memorized_verses')
      .insert({
        child_id: childId,
        verse_id: verseId,
        church_id: profile.church_id,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
        notes,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Versículo já memorizado' }
      }
      console.error('Error marking verse:', error)
      return { success: false, error: 'Erro ao registrar versículo' }
    }

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in markVerseAsMemorized:', error)
    return { success: false, error: 'Erro ao registrar versículo' }
  }
}

export async function getChildMemorizedVerses(childId: string): Promise<ChildMemorizedVerse[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_child_memorized_verses')
    .select(`
      *,
      verse:kids_memory_verses(*),
      verified_by_profile:profiles!kids_child_memorized_verses_verified_by_fkey(full_name)
    `)
    .eq('child_id', childId)
    .order('memorized_at', { ascending: false })

  if (error) {
    console.error('Error fetching memorized verses:', error)
    return []
  }

  return data as unknown as ChildMemorizedVerse[]
}

// =====================================================
// MEDALHAS
// =====================================================

export async function getBadges(): Promise<Badge[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_badges')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }

  return data as Badge[]
}

export async function awardBadge(childId: string, badgeId: string, notes?: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR', 'PASTORA_KIDS', 'DISCIPULADORA_KIDS'
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_child_badges')
      .insert({
        child_id: childId,
        badge_id: badgeId,
        church_id: profile.church_id,
        awarded_by: profile.id,
        notes,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Medalha já conquistada' }
      }
      console.error('Error awarding badge:', error)
      return { success: false, error: 'Erro ao conceder medalha' }
    }

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in awardBadge:', error)
    return { success: false, error: 'Erro ao conceder medalha' }
  }
}

export async function getChildBadges(childId: string): Promise<ChildBadge[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_child_badges')
    .select(`
      *,
      badge:kids_badges(*),
      awarded_by_profile:profiles!kids_child_badges_awarded_by_fkey(full_name)
    `)
    .eq('child_id', childId)
    .order('earned_at', { ascending: false })

  if (error) {
    console.error('Error fetching child badges:', error)
    return []
  }

  return data as unknown as ChildBadge[]
}

// =====================================================
// ATIVIDADES DO DISCÍPULO
// =====================================================

export async function getDiscipleActivities(): Promise<DiscipleActivity[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_disciple_activities')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }

  return data as DiscipleActivity[]
}

export async function recordChildActivity(childId: string, activityId: string, notes?: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR', 'PASTORA_KIDS', 'DISCIPULADORA_KIDS', 'LEADER_KIDS'
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_child_activities')
      .insert({
        child_id: childId,
        activity_id: activityId,
        church_id: profile.church_id,
        recorded_by: profile.id,
        notes,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Atividade já registrada hoje' }
      }
      console.error('Error recording activity:', error)
      return { success: false, error: 'Erro ao registrar atividade' }
    }

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in recordChildActivity:', error)
    return { success: false, error: 'Erro ao registrar atividade' }
  }
}

export async function getChildActivities(childId: string, date?: string): Promise<ChildActivity[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  let query = supabase
    .from('kids_child_activities')
    .select(`
      *,
      activity:kids_disciple_activities(*)
    `)
    .eq('child_id', childId)
    .order('completed_at', { ascending: false })

  if (date) {
    query = query.eq('completed_date', date)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching child activities:', error)
    return []
  }

  return data as unknown as ChildActivity[]
}

// =====================================================
// PONTOS
// =====================================================

export async function addManualPoints(childId: string, points: number, reason: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR', 'PASTORA_KIDS', 'DISCIPULADORA_KIDS'
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_points_log')
      .insert({
        child_id: childId,
        church_id: profile.church_id,
        points,
        reason,
        source_type: 'manual',
        awarded_by: profile.id,
      })

    if (error) {
      console.error('Error adding points:', error)
      return { success: false, error: 'Erro ao adicionar pontos' }
    }

    // Update total points
    await supabase.rpc('update_child_total_points', { p_child_id: childId })

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in addManualPoints:', error)
    return { success: false, error: 'Erro ao adicionar pontos' }
  }
}

export async function getChildPointsLog(childId: string): Promise<PointsLog[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_points_log')
    .select(`
      *,
      awarded_by_profile:profiles!kids_points_log_awarded_by_fkey(full_name)
    `)
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching points log:', error)
    return []
  }

  return data as unknown as PointsLog[]
}

// =====================================================
// NÍVEIS
// =====================================================

export async function getLevels(): Promise<Level[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_levels')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('order_index')

  if (error) {
    console.error('Error fetching levels:', error)
    return []
  }

  return data as Level[]
}

// =====================================================
// ESTATÍSTICAS DE GAMIFICAÇÃO
// =====================================================

export async function getChildGamificationStats(childId: string): Promise<GamificationStats | null> {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Get child data
  const { data: child } = await supabase
    .from('kids_children')
    .select('total_points, current_streak, best_streak')
    .eq('id', childId)
    .single()

  if (!child) return null

  // Get counts
  const [versesResult, badgesResult, activitiesResult, levelsResult] = await Promise.all([
    supabase.from('kids_child_memorized_verses').select('id', { count: 'exact' }).eq('child_id', childId),
    supabase.from('kids_child_badges').select('id', { count: 'exact' }).eq('child_id', childId),
    supabase.from('kids_child_activities').select('id', { count: 'exact' }).eq('child_id', childId),
    supabase.from('kids_levels').select('*').eq('church_id', profile.church_id).order('order_index'),
  ])

  const levels = levelsResult.data as Level[] || []
  const totalPoints = child.total_points || 0

  // Find current and next level
  let currentLevel: Level | null = null
  let nextLevel: Level | null = null

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    if (totalPoints >= level.min_points && (level.max_points === null || totalPoints <= level.max_points)) {
      currentLevel = level
      nextLevel = levels[i + 1] || null
      break
    }
  }

  const pointsToNextLevel = nextLevel ? nextLevel.min_points - totalPoints : 0

  return {
    totalPoints,
    totalVerses: versesResult.count || 0,
    totalBadges: badgesResult.count || 0,
    totalActivities: activitiesResult.count || 0,
    currentStreak: child.current_streak || 0,
    bestStreak: child.best_streak || 0,
    currentLevel,
    nextLevel,
    pointsToNextLevel,
  }
}

// =====================================================
// RANKING
// =====================================================

export async function getKidsRanking(limit: number = 10) {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_children')
    .select(`
      id,
      full_name,
      photo_url,
      total_points,
      current_level_id,
      current_level:kids_levels(name, icon_name, color)
    `)
    .eq('church_id', profile.church_id)
    .order('total_points', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching ranking:', error)
    return []
  }

  return data
}

// =====================================================
// SEED FUNCTIONS
// =====================================================

export async function seedDefaultGamificationData() {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Seed activities
    await supabase.rpc('seed_default_disciple_activities', { p_church_id: profile.church_id })
    
    // Seed badges
    await supabase.rpc('seed_default_badges', { p_church_id: profile.church_id })
    
    // Seed levels
    await supabase.rpc('seed_default_levels', { p_church_id: profile.church_id })
    
    // Seed verses
    await supabase.rpc('seed_default_verses', { p_church_id: profile.church_id })

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error seeding gamification data:', error)
    return { success: false, error: 'Erro ao criar dados padrão' }
  }
}
