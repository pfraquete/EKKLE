'use server'

/**
 * Member Statistics Server Actions
 * 
 * Fetches various statistics for member dashboard
 */

import { createClient } from '@/lib/supabase/server'

export interface MemberStats {
  // Bible reading
  bibleStreak: number
  longestBibleStreak: number
  chaptersRead: number
  
  // Prayer
  prayerStreak: number
  totalPrayers: number
  prayerMinutes: number
  
  // Courses
  coursesEnrolled: number
  coursesCompleted: number
  lessonsCompleted: number
  
  // Church attendance
  cultoAttendance: number
  cellAttendance: number
  eventsAttended: number
  
  // Member info
  memberSince: string
  memberStage: string
}

export async function getMemberStats(): Promise<{
  success: boolean
  stats?: MemberStats
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, member_stage')
      .eq('id', user.id)
      .single()

    // Get Bible reading streak
    const { data: bibleStreak } = await supabase
      .from('user_reading_plans')
      .select('current_streak, longest_streak')
      .eq('profile_id', user.id)
      .order('current_streak', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Count chapters read (from reading progress)
    const { count: chaptersRead } = await supabase
      .from('reading_plan_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_plan_id', user.id)

    // Get prayer streak
    const { data: prayerStreak } = await supabase
      .from('prayer_streaks')
      .select('current_streak, longest_streak')
      .eq('profile_id', user.id)
      .maybeSingle()

    // Count prayers
    const { count: totalPrayers } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)

    // Sum prayer minutes
    const { data: prayerMinutesData } = await supabase
      .from('prayers')
      .select('duration_seconds')
      .eq('profile_id', user.id)

    const prayerMinutes = prayerMinutesData
      ? Math.round(prayerMinutesData.reduce((acc, p) => acc + (p.duration_seconds || 0), 0) / 60)
      : 0

    // Get course enrollments
    const { count: coursesEnrolled } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)

    // Get completed courses
    const { count: coursesCompleted } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('status', 'COMPLETED')

    // Get lessons completed
    const { count: lessonsCompleted } = await supabase
      .from('course_video_progress')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('completed', true)

    // Get culto attendance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: cultoAttendance } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get cell meeting attendance
    const { count: cellAttendance } = await supabase
      .from('cell_meetings')
      .select('*', { count: 'exact', head: true })
      .contains('present_members', [user.id])

    // Get events attended
    const { count: eventsAttended } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)

    const stats: MemberStats = {
      bibleStreak: bibleStreak?.current_streak || 0,
      longestBibleStreak: bibleStreak?.longest_streak || 0,
      chaptersRead: chaptersRead || 0,
      prayerStreak: prayerStreak?.current_streak || 0,
      totalPrayers: totalPrayers || 0,
      prayerMinutes,
      coursesEnrolled: coursesEnrolled || 0,
      coursesCompleted: coursesCompleted || 0,
      lessonsCompleted: lessonsCompleted || 0,
      cultoAttendance: cultoAttendance || 0,
      cellAttendance: cellAttendance || 0,
      eventsAttended: eventsAttended || 0,
      memberSince: profile?.created_at || user.created_at,
      memberStage: profile?.member_stage || 'Visitante',
    }

    return { success: true, stats }
  } catch (error) {
    console.error('[getMemberStats] Error:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}
