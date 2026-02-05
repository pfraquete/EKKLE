'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export interface Badge {
  id: string
  church_id: string
  name: string
  description: string | null
  image_url: string | null
  opening_page: string
  always_visible: boolean
  relevance: number
  created_at: string
  updated_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  created_at: string
  badge?: Badge
}

export interface BadgeWithUsers extends Badge {
  user_count: number
}

// Get all badges for the current church
export async function getBadges(): Promise<{ data: BadgeWithUsers[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { data: null, error: 'Perfil não encontrado' }
  }

  const { data: badges, error } = await supabase
    .from('badges')
    .select(`
      *,
      user_badges (count)
    `)
    .eq('church_id', userProfile.church_id)
    .order('relevance', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  // Transform the data to include user_count
  const badgesWithCount = badges?.map(badge => ({
    ...badge,
    user_count: badge.user_badges?.[0]?.count || 0,
    user_badges: undefined
  })) as BadgeWithUsers[]

  return { data: badgesWithCount, error: null }
}

// Get a single badge by ID
export async function getBadgeById(badgeId: string): Promise<{ data: Badge | null; error: string | null }> {
  const supabase = await createClient()

  const { data: badge, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: badge, error: null }
}

// Create a new badge
export async function createBadge(formData: FormData): Promise<{ data: Badge | null; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { data: null, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { data: null, error: 'Permissão negada' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const image_url = formData.get('image_url') as string | null
  const opening_page = formData.get('opening_page') as string || 'feed'
  const always_visible = formData.get('always_visible') === 'true'
  const relevance = parseInt(formData.get('relevance') as string) || 0

  if (!name) {
    return { data: null, error: 'Nome é obrigatório' }
  }

  const { data: badge, error } = await supabase
    .from('badges')
    .insert({
      church_id: userProfile.church_id,
      name,
      description,
      image_url,
      opening_page,
      always_visible,
      relevance
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  return { data: badge, error: null }
}

// Update a badge
export async function updateBadge(badgeId: string, formData: FormData): Promise<{ data: Badge | null; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { data: null, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { data: null, error: 'Permissão negada' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const image_url = formData.get('image_url') as string | null
  const opening_page = formData.get('opening_page') as string || 'feed'
  const always_visible = formData.get('always_visible') === 'true'
  const relevance = parseInt(formData.get('relevance') as string) || 0

  if (!name) {
    return { data: null, error: 'Nome é obrigatório' }
  }

  const { data: badge, error } = await supabase
    .from('badges')
    .update({
      name,
      description,
      image_url,
      opening_page,
      always_visible,
      relevance,
      updated_at: new Date().toISOString()
    })
    .eq('id', badgeId)
    .eq('church_id', userProfile.church_id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  return { data: badge, error: null }
}

// Delete a badge
export async function deleteBadge(badgeId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { success: false, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { success: false, error: 'Permissão negada' }
  }

  const { error } = await supabase
    .from('badges')
    .delete()
    .eq('id', badgeId)
    .eq('church_id', userProfile.church_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  return { success: true, error: null }
}

// Assign a badge to a user
export async function assignBadge(userId: string, badgeId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { success: false, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { success: false, error: 'Permissão negada' }
  }

  // Verify the badge belongs to the same church
  const { data: badge } = await supabase
    .from('badges')
    .select('church_id')
    .eq('id', badgeId)
    .single()

  if (!badge || badge.church_id !== userProfile.church_id) {
    return { success: false, error: 'Selo não encontrado' }
  }

  // Verify the user belongs to the same church
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', userId)
    .single()

  if (!targetUser || targetUser.church_id !== userProfile.church_id) {
    return { success: false, error: 'Usuário não encontrado' }
  }

  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      earned_at: new Date().toISOString()
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Usuário já possui este selo' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  revalidatePath(`/membros/${userId}`)
  return { success: true, error: null }
}

// Remove a badge from a user
export async function removeBadge(userId: string, badgeId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { success: false, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { success: false, error: 'Permissão negada' }
  }

  const { error } = await supabase
    .from('user_badges')
    .delete()
    .eq('user_id', userId)
    .eq('badge_id', badgeId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  revalidatePath(`/membros/${userId}`)
  return { success: true, error: null }
}

// Get badges for a specific user
export async function getUserBadges(userId: string): Promise<{ data: UserBadge[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: userBadges, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: userBadges, error: null }
}

// Get all badges for the current user (including always_visible ones)
export async function getMyBadges(): Promise<{ data: { earned: Badge[]; available: Badge[] } | null; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { data: null, error: 'Perfil não encontrado' }
  }

  // Get all badges from the church
  const { data: allBadges, error: badgesError } = await supabase
    .from('badges')
    .select('*')
    .eq('church_id', userProfile.church_id)
    .order('relevance', { ascending: false })

  if (badgesError) {
    return { data: null, error: badgesError.message }
  }

  // Get user's earned badges
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', profile.user.id)

  if (userBadgesError) {
    return { data: null, error: userBadgesError.message }
  }

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

  const earned = allBadges?.filter(b => earnedBadgeIds.has(b.id)) || []
  const available = allBadges?.filter(b => !earnedBadgeIds.has(b.id) && b.always_visible) || []

  return { data: { earned, available }, error: null }
}

// Get users who have a specific badge
export async function getBadgeUsers(badgeId: string): Promise<{ data: { id: string; full_name: string; photo_url: string | null; earned_at: string }[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: userBadges, error } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      profile:profiles (
        id,
        full_name,
        photo_url
      )
    `)
    .eq('badge_id', badgeId)
    .order('earned_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  const users = userBadges?.map(ub => ({
    id: (ub.profile as any).id,
    full_name: (ub.profile as any).full_name,
    photo_url: (ub.profile as any).photo_url,
    earned_at: ub.earned_at
  })) || []

  return { data: users, error: null }
}

// Bulk assign badges to multiple users
export async function bulkAssignBadge(userIds: string[], badgeId: string): Promise<{ success: boolean; assigned: number; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { success: false, assigned: 0, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { success: false, assigned: 0, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { success: false, assigned: 0, error: 'Permissão negada' }
  }

  // Verify the badge belongs to the same church
  const { data: badge } = await supabase
    .from('badges')
    .select('church_id')
    .eq('id', badgeId)
    .single()

  if (!badge || badge.church_id !== userProfile.church_id) {
    return { success: false, assigned: 0, error: 'Selo não encontrado' }
  }

  // Insert badges for all users (ignoring duplicates)
  const inserts = userIds.map(userId => ({
    user_id: userId,
    badge_id: badgeId,
    earned_at: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('user_badges')
    .upsert(inserts, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
    .select()

  if (error) {
    return { success: false, assigned: 0, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  return { success: true, assigned: data?.length || 0, error: null }
}

// Update badge relevance (order)
export async function updateBadgeRelevance(badgeId: string, relevance: number): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { success: false, error: 'Perfil não encontrado' }
  }

  if (!['PASTOR', 'LEADER'].includes(userProfile.role)) {
    return { success: false, error: 'Permissão negada' }
  }

  const { error } = await supabase
    .from('badges')
    .update({ relevance, updated_at: new Date().toISOString() })
    .eq('id', badgeId)
    .eq('church_id', userProfile.church_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/selos')
  return { success: true, error: null }
}

// Search members to assign badges
export async function searchMembersForBadge(query: string): Promise<{ data: { id: string; full_name: string; photo_url: string | null; email: string | null }[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', profile.user.id)
    .single()

  if (!userProfile) {
    return { data: null, error: 'Perfil não encontrado' }
  }

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, email')
    .eq('church_id', userProfile.church_id)
    .ilike('full_name', `%${query}%`)
    .limit(20)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: members, error: null }
}
