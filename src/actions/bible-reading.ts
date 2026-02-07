'use server'

/**
 * Bible Reading Server Actions
 *
 * Server actions for Bible reading plans.
 * Handles individual and group reading plans with streak tracking.
 */

import { createClient } from '@/lib/supabase/server'
import { BibleApiService, DEFAULT_VERSION, BOOK_NAMES } from '@/lib/bible-api-service'

// Helper to format reference
function formatReadingReference(bookId: string, chapterStart: number, chapterEnd?: number | null): string {
    const bookName = BOOK_NAMES[bookId.toUpperCase()] || bookId
    if (chapterEnd && chapterEnd !== chapterStart) {
        return `${bookName} ${chapterStart}-${chapterEnd}`
    }
    return `${bookName} ${chapterStart}`
}
import { revalidatePath } from 'next/cache'

// ============================================
// Types
// ============================================

export interface ReadingPlan {
    id: string
    church_id: string | null
    name: string
    description: string | null
    duration_days: number
    plan_type: 'SEQUENTIAL' | 'THEMATIC' | 'CHRONOLOGICAL'
    is_public: boolean
    is_active: boolean
    created_at: string
}

export interface PlanReading {
    id: string
    plan_id: string
    day_number: number
    bible_id: string
    book_id: string
    chapter_start: number
    chapter_end: number | null
    reading_title: string | null
}

export interface UserPlan {
    id: string
    church_id: string
    profile_id: string
    plan_id: string
    start_date: string
    current_day: number
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
    current_streak: number
    longest_streak: number
    last_reading_date: string | null
    created_at: string
    plan?: ReadingPlan
}

export interface ReadingProgress {
    id: string
    user_plan_id: string
    reading_id: string
    day_number: number
    completed_at: string
    notes: string | null
}

export interface GroupPlan {
    id: string
    church_id: string
    cell_id: string
    plan_id: string
    name: string | null
    start_date: string
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
    created_by: string
    created_at: string
    plan?: ReadingPlan
}

export interface GroupMember {
    id: string
    group_plan_id: string
    profile_id: string
    current_day: number
    current_streak: number
    last_reading_date: string | null
    joined_at: string
    profile?: {
        full_name: string
        avatar_url: string | null
    }
}

// ============================================
// Individual Plan Actions
// ============================================

/**
 * Get available reading plans (public + church-specific)
 */
export async function getAvailablePlans(): Promise<{
    success: boolean
    data?: ReadingPlan[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        // Get current user's church
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id) {
            return { success: false, error: 'Igreja não encontrada' }
        }

        // Get public plans + church plans
        const { data: plans, error } = await supabase
            .from('bible_reading_plans')
            .select('*')
            .eq('is_active', true)
            .or(`is_public.eq.true,church_id.eq.${profile.church_id}`)
            .order('duration_days', { ascending: true })

        if (error) throw error

        return { success: true, data: plans || [] }
    } catch (error) {
        console.error('[Bible Reading] Error getting plans:', error)
        return { success: false, error: 'Erro ao buscar planos' }
    }
}

/**
 * Get plan details with all readings
 */
export async function getPlanDetails(planId: string): Promise<{
    success: boolean
    data?: ReadingPlan & { readings: PlanReading[] }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: plan, error: planError } = await supabase
            .from('bible_reading_plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError) throw planError

        const { data: readings, error: readingsError } = await supabase
            .from('bible_plan_readings')
            .select('*')
            .eq('plan_id', planId)
            .order('day_number', { ascending: true })

        if (readingsError) throw readingsError

        return {
            success: true,
            data: { ...plan, readings: readings || [] }
        }
    } catch (error) {
        console.error('[Bible Reading] Error getting plan details:', error)
        return { success: false, error: 'Erro ao buscar detalhes do plano' }
    }
}

/**
 * Start a reading plan
 */
export async function startReadingPlan(
    planId: string,
    startDate?: string
): Promise<{
    success: boolean
    data?: UserPlan
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id) {
            return { success: false, error: 'Igreja não encontrada' }
        }

        // Check if user already has an active plan
        const { data: existingPlan } = await supabase
            .from('user_reading_plans')
            .select('id')
            .eq('profile_id', user.id)
            .eq('status', 'ACTIVE')
            .single()

        if (existingPlan) {
            return { success: false, error: 'Você já possui um plano ativo. Pause ou complete o atual primeiro.' }
        }

        // Create user plan
        const { data: userPlan, error } = await supabase
            .from('user_reading_plans')
            .insert({
                church_id: profile.church_id,
                profile_id: user.id,
                plan_id: planId,
                start_date: startDate || new Date().toISOString().split('T')[0],
                current_day: 1,
                status: 'ACTIVE',
                current_streak: 0,
                longest_streak: 0,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/membro/biblia-oracao')
        return { success: true, data: userPlan }
    } catch (error) {
        console.error('[Bible Reading] Error starting plan:', error)
        return { success: false, error: 'Erro ao iniciar plano' }
    }
}

/**
 * Get user's active reading plan
 */
export async function getMyActivePlan(): Promise<{
    success: boolean
    data?: UserPlan & {
        plan: ReadingPlan
        progress: ReadingProgress[]
        totalReadings: number
    }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Get active plan with plan details
        const { data: userPlan, error: planError } = await supabase
            .from('user_reading_plans')
            .select(`
                *,
                plan:bible_reading_plans(*)
            `)
            .eq('profile_id', user.id)
            .eq('status', 'ACTIVE')
            .single()

        if (planError && planError.code !== 'PGRST116') throw planError

        if (!userPlan) {
            return { success: true, data: undefined }
        }

        // Get progress
        const { data: progress } = await supabase
            .from('reading_plan_progress')
            .select('*')
            .eq('user_plan_id', userPlan.id)
            .order('day_number', { ascending: true })

        // Get total readings
        const { count: totalReadings } = await supabase
            .from('bible_plan_readings')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', userPlan.plan_id)

        return {
            success: true,
            data: {
                ...userPlan,
                progress: progress || [],
                totalReadings: totalReadings || 0
            }
        }
    } catch (error) {
        console.error('[Bible Reading] Error getting active plan:', error)
        return { success: false, error: 'Erro ao buscar plano ativo' }
    }
}

/**
 * Get today's reading for active plan
 */
export async function getTodaysReading(): Promise<{
    success: boolean
    data?: {
        reading: PlanReading
        userPlan: UserPlan
        isCompleted: boolean
        dayNumber: number
    }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Get active plan
        const { data: userPlan } = await supabase
            .from('user_reading_plans')
            .select('*')
            .eq('profile_id', user.id)
            .eq('status', 'ACTIVE')
            .single()

        if (!userPlan) {
            return { success: false, error: 'Nenhum plano ativo' }
        }

        // Calculate current day based on start date
        const startDate = new Date(userPlan.start_date)
        const today = new Date()
        const diffTime = today.getTime() - startDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
        const currentDay = Math.max(1, Math.min(diffDays, userPlan.current_day))

        // Get today's reading
        const { data: reading, error } = await supabase
            .from('bible_plan_readings')
            .select('*')
            .eq('plan_id', userPlan.plan_id)
            .eq('day_number', currentDay)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        if (!reading) {
            return { success: false, error: 'Leitura não encontrada para hoje' }
        }

        // Check if already completed
        const { data: progress } = await supabase
            .from('reading_plan_progress')
            .select('id')
            .eq('user_plan_id', userPlan.id)
            .eq('reading_id', reading.id)
            .single()

        return {
            success: true,
            data: {
                reading,
                userPlan,
                isCompleted: !!progress,
                dayNumber: currentDay
            }
        }
    } catch (error) {
        console.error('[Bible Reading] Error getting today\'s reading:', error)
        return { success: false, error: 'Erro ao buscar leitura de hoje' }
    }
}

/**
 * Get Bible passage content
 * Using bible-api.com with João Ferreira de Almeida (complete Old and New Testament)
 */
export async function getBiblePassage(
    bookId: string,
    chapterStart: number,
    chapterEnd?: number | null,
    version: string = DEFAULT_VERSION
): Promise<{
    success: boolean
    data?: {
        content: string
        reference: string
    }
    error?: string
}> {
    try {
        const bibleService = new BibleApiService(version as any)
        
        const passage = await bibleService.getPassage(
            bookId,
            chapterStart,
            chapterEnd || undefined
        )

        return {
            success: true,
            data: {
                content: passage.content,
                reference: passage.reference || formatReadingReference(bookId, chapterStart, chapterEnd)
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Bible Reading] Error getting passage:', errorMessage)

        // Return user-friendly messages based on error type
        if (errorMessage.includes('429') || errorMessage.includes('rate')) {
            return {
                success: false,
                error: 'Muitas requisições. Aguarde alguns segundos e tente novamente.'
            }
        }

        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            return {
                success: false,
                error: 'Conexão lenta. Tente novamente.'
            }
        }

        if (errorMessage.includes('No verses') || errorMessage.includes('not found')) {
            return {
                success: false,
                error: 'Passagem não encontrada. Verifique o livro e capítulo selecionados.'
            }
        }

        return { success: false, error: 'Erro ao buscar passagem bíblica. Tente novamente.' }
    }
}

/**
 * Mark reading as complete
 */
export async function markReadingComplete(
    readingId: string,
    notes?: string
): Promise<{
    success: boolean
    data?: { newStreak: number }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id) {
            return { success: false, error: 'Igreja não encontrada' }
        }

        // Get active plan
        const { data: userPlan } = await supabase
            .from('user_reading_plans')
            .select('id')
            .eq('profile_id', user.id)
            .eq('status', 'ACTIVE')
            .single()

        if (!userPlan) {
            return { success: false, error: 'Nenhum plano ativo' }
        }

        // Get reading info
        const { data: reading } = await supabase
            .from('bible_plan_readings')
            .select('day_number')
            .eq('id', readingId)
            .single()

        if (!reading) {
            return { success: false, error: 'Leitura não encontrada' }
        }

        // Check if already completed
        const { data: existing } = await supabase
            .from('reading_plan_progress')
            .select('id')
            .eq('user_plan_id', userPlan.id)
            .eq('reading_id', readingId)
            .single()

        if (existing) {
            return { success: false, error: 'Leitura já foi completada' }
        }

        // Insert progress (trigger will update streak)
        const { error } = await supabase
            .from('reading_plan_progress')
            .insert({
                church_id: profile.church_id,
                user_plan_id: userPlan.id,
                reading_id: readingId,
                day_number: reading.day_number,
                notes: notes || null,
            })

        if (error) throw error

        // Get updated streak
        const { data: updatedPlan } = await supabase
            .from('user_reading_plans')
            .select('current_streak')
            .eq('id', userPlan.id)
            .single()

        revalidatePath('/membro/biblia-oracao')
        revalidatePath('/membro/biblia-oracao/meu-plano')

        return {
            success: true,
            data: { newStreak: updatedPlan?.current_streak || 1 }
        }
    } catch (error) {
        console.error('[Bible Reading] Error marking complete:', error)
        return { success: false, error: 'Erro ao marcar leitura' }
    }
}

/**
 * Pause active plan
 */
export async function pauseReadingPlan(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { error } = await supabase
            .from('user_reading_plans')
            .update({ status: 'PAUSED' })
            .eq('profile_id', user.id)
            .eq('status', 'ACTIVE')

        if (error) throw error

        revalidatePath('/membro/biblia-oracao')
        return { success: true }
    } catch (error) {
        console.error('[Bible Reading] Error pausing plan:', error)
        return { success: false, error: 'Erro ao pausar plano' }
    }
}

/**
 * Resume paused plan
 */
export async function resumeReadingPlan(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { error } = await supabase
            .from('user_reading_plans')
            .update({ status: 'ACTIVE' })
            .eq('profile_id', user.id)
            .eq('status', 'PAUSED')

        if (error) throw error

        revalidatePath('/membro/biblia-oracao')
        return { success: true }
    } catch (error) {
        console.error('[Bible Reading] Error resuming plan:', error)
        return { success: false, error: 'Erro ao retomar plano' }
    }
}

// ============================================
// Group Plan Actions
// ============================================

/**
 * Create a group reading plan for a cell
 */
export async function createGroupPlan(
    planId: string,
    cellId: string,
    name?: string,
    startDate?: string
): Promise<{
    success: boolean
    data?: GroupPlan
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id) {
            return { success: false, error: 'Igreja não encontrada' }
        }

        // Check if user is leader of this cell
        const { data: cell } = await supabase
            .from('cells')
            .select('leader_id')
            .eq('id', cellId)
            .single()

        if (!cell) {
            return { success: false, error: 'Célula não encontrada' }
        }

        if (cell.leader_id !== user.id && profile.role !== 'ADMIN' && profile.role !== 'PASTOR') {
            return { success: false, error: 'Apenas líderes podem criar planos de grupo' }
        }

        // Check if cell already has active plan
        const { data: existingPlan } = await supabase
            .from('group_reading_plans')
            .select('id')
            .eq('cell_id', cellId)
            .eq('status', 'ACTIVE')
            .single()

        if (existingPlan) {
            return { success: false, error: 'Esta célula já possui um plano ativo' }
        }

        // Get plan name if not provided
        let planName = name
        if (!planName) {
            const { data: plan } = await supabase
                .from('bible_reading_plans')
                .select('name')
                .eq('id', planId)
                .single()
            planName = plan?.name
        }

        // Create group plan
        const { data: groupPlan, error } = await supabase
            .from('group_reading_plans')
            .insert({
                church_id: profile.church_id,
                cell_id: cellId,
                plan_id: planId,
                name: planName,
                start_date: startDate || new Date().toISOString().split('T')[0],
                status: 'ACTIVE',
                created_by: user.id,
            })
            .select()
            .single()

        if (error) throw error

        // Auto-join creator as member
        await supabase
            .from('group_reading_members')
            .insert({
                church_id: profile.church_id,
                group_plan_id: groupPlan.id,
                profile_id: user.id,
                current_day: 1,
                current_streak: 0,
            })

        revalidatePath('/membro/minha-celula/plano-leitura')
        return { success: true, data: groupPlan }
    } catch (error) {
        console.error('[Bible Reading] Error creating group plan:', error)
        return { success: false, error: 'Erro ao criar plano de grupo' }
    }
}

/**
 * Get cell's active group plan
 */
export async function getCellGroupPlan(): Promise<{
    success: boolean
    data?: GroupPlan & {
        plan: ReadingPlan
        members: GroupMember[]
        myMembership: GroupMember | null
        totalReadings: number
    }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Get user's cell
        const { data: profile } = await supabase
            .from('profiles')
            .select('cell_id')
            .eq('id', user.id)
            .single()

        if (!profile?.cell_id) {
            return { success: false, error: 'Você não pertence a uma célula' }
        }

        // Get active group plan
        const { data: groupPlan, error } = await supabase
            .from('group_reading_plans')
            .select(`
                *,
                plan:bible_reading_plans(*)
            `)
            .eq('cell_id', profile.cell_id)
            .eq('status', 'ACTIVE')
            .single()

        if (error && error.code !== 'PGRST116') throw error

        if (!groupPlan) {
            return { success: true, data: undefined }
        }

        // Get members with profiles
        const { data: members } = await supabase
            .from('group_reading_members')
            .select(`
                *,
                profile:profiles(full_name, avatar_url)
            `)
            .eq('group_plan_id', groupPlan.id)
            .order('current_streak', { ascending: false })

        // Find my membership
        const myMembership = members?.find(m => m.profile_id === user.id) || null

        // Get total readings
        const { count: totalReadings } = await supabase
            .from('bible_plan_readings')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', groupPlan.plan_id)

        return {
            success: true,
            data: {
                ...groupPlan,
                members: members || [],
                myMembership,
                totalReadings: totalReadings || 0
            }
        }
    } catch (error) {
        console.error('[Bible Reading] Error getting cell group plan:', error)
        return { success: false, error: 'Erro ao buscar plano do grupo' }
    }
}

/**
 * Join a group plan
 */
export async function joinGroupPlan(groupPlanId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id, cell_id')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id) {
            return { success: false, error: 'Igreja não encontrada' }
        }

        // Verify group plan exists and user's cell matches
        const { data: groupPlan } = await supabase
            .from('group_reading_plans')
            .select('cell_id')
            .eq('id', groupPlanId)
            .eq('status', 'ACTIVE')
            .single()

        if (!groupPlan) {
            return { success: false, error: 'Plano de grupo não encontrado' }
        }

        if (groupPlan.cell_id !== profile.cell_id) {
            return { success: false, error: 'Você não pertence a esta célula' }
        }

        // Check if already member
        const { data: existing } = await supabase
            .from('group_reading_members')
            .select('id')
            .eq('group_plan_id', groupPlanId)
            .eq('profile_id', user.id)
            .single()

        if (existing) {
            return { success: false, error: 'Você já participa deste plano' }
        }

        // Join
        const { error } = await supabase
            .from('group_reading_members')
            .insert({
                church_id: profile.church_id,
                group_plan_id: groupPlanId,
                profile_id: user.id,
                current_day: 1,
                current_streak: 0,
            })

        if (error) throw error

        revalidatePath('/membro/minha-celula/plano-leitura')
        return { success: true }
    } catch (error) {
        console.error('[Bible Reading] Error joining group plan:', error)
        return { success: false, error: 'Erro ao entrar no plano' }
    }
}

/**
 * Mark group reading as complete
 */
export async function markGroupReadingComplete(
    readingId: string
): Promise<{
    success: boolean
    data?: { newStreak: number }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id, cell_id')
            .eq('id', user.id)
            .single()

        if (!profile?.church_id || !profile.cell_id) {
            return { success: false, error: 'Perfil incompleto' }
        }

        // Get active group plan for user's cell
        const { data: groupPlan } = await supabase
            .from('group_reading_plans')
            .select('id')
            .eq('cell_id', profile.cell_id)
            .eq('status', 'ACTIVE')
            .single()

        if (!groupPlan) {
            return { success: false, error: 'Nenhum plano de grupo ativo' }
        }

        // Get user's membership
        const { data: membership } = await supabase
            .from('group_reading_members')
            .select('id, current_streak, last_reading_date')
            .eq('group_plan_id', groupPlan.id)
            .eq('profile_id', user.id)
            .single()

        if (!membership) {
            return { success: false, error: 'Você não participa deste plano' }
        }

        // Get reading info
        const { data: reading } = await supabase
            .from('bible_plan_readings')
            .select('day_number')
            .eq('id', readingId)
            .single()

        if (!reading) {
            return { success: false, error: 'Leitura não encontrada' }
        }

        // Check if already completed
        const { data: existing } = await supabase
            .from('group_reading_progress')
            .select('id')
            .eq('member_id', membership.id)
            .eq('reading_id', readingId)
            .single()

        if (existing) {
            return { success: false, error: 'Leitura já foi completada' }
        }

        // Insert progress
        const { error } = await supabase
            .from('group_reading_progress')
            .insert({
                church_id: profile.church_id,
                group_plan_id: groupPlan.id,
                member_id: membership.id,
                reading_id: readingId,
                day_number: reading.day_number,
            })

        if (error) throw error

        // Calculate and update streak
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        let newStreak = 1
        if (membership.last_reading_date === yesterday) {
            newStreak = membership.current_streak + 1
        } else if (membership.last_reading_date === today) {
            newStreak = membership.current_streak
        }

        await supabase
            .from('group_reading_members')
            .update({
                current_streak: newStreak,
                last_reading_date: today,
                current_day: Math.max(membership.current_streak + 1, reading.day_number + 1)
            })
            .eq('id', membership.id)

        revalidatePath('/membro/minha-celula/plano-leitura')
        return { success: true, data: { newStreak } }
    } catch (error) {
        console.error('[Bible Reading] Error marking group reading:', error)
        return { success: false, error: 'Erro ao marcar leitura' }
    }
}

/**
 * Get group members progress
 */
export async function getGroupMembersProgress(groupPlanId: string): Promise<{
    success: boolean
    data?: Array<{
        member: GroupMember
        completedCount: number
        progressPercent: number
    }>
    error?: string
}> {
    try {
        const supabase = await createClient()

        // Get all members
        const { data: members, error: membersError } = await supabase
            .from('group_reading_members')
            .select(`
                *,
                profile:profiles(full_name, avatar_url)
            `)
            .eq('group_plan_id', groupPlanId)

        if (membersError) throw membersError

        if (!members || members.length === 0) {
            return { success: true, data: [] }
        }

        // Get plan info for total readings
        const { data: groupPlan } = await supabase
            .from('group_reading_plans')
            .select('plan_id')
            .eq('id', groupPlanId)
            .single()

        if (!groupPlan) {
            return { success: false, error: 'Plano não encontrado' }
        }

        const { count: totalReadings } = await supabase
            .from('bible_plan_readings')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', groupPlan.plan_id)

        // Get progress for each member
        const result = await Promise.all(
            members.map(async (member) => {
                const { count: completedCount } = await supabase
                    .from('group_reading_progress')
                    .select('*', { count: 'exact', head: true })
                    .eq('member_id', member.id)

                return {
                    member,
                    completedCount: completedCount || 0,
                    progressPercent: totalReadings
                        ? Math.round(((completedCount || 0) / totalReadings) * 100)
                        : 0
                }
            })
        )

        // Sort by progress
        result.sort((a, b) => b.completedCount - a.completedCount)

        return { success: true, data: result }
    } catch (error) {
        console.error('[Bible Reading] Error getting group progress:', error)
        return { success: false, error: 'Erro ao buscar progresso do grupo' }
    }
}
