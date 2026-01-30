'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { OpenAIService } from '@/lib/openai'

// Types
export interface Prayer {
  id: string
  church_id: string
  profile_id: string
  audio_url: string | null
  audio_duration_seconds: number | null
  transcription: string | null
  transcription_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  ai_summary: string | null
  ai_insights: Record<string, unknown>
  suggested_verses: Array<{ reference: string; text: string }>
  blessing_received: boolean
  blessing_received_at: string | null
  blessing_notes: string | null
  session_type: 'INDIVIDUAL' | 'GROUP'
  prayer_room_id: string | null
  created_at: string
  updated_at: string
}

export interface PrayerItem {
  id: string
  church_id: string
  prayer_id: string
  profile_id: string
  item_type: 'MOTIVO' | 'PROMESSA' | 'TRANSFORMACAO' | 'PESSOA'
  content: string
  person_name: string | null
  verse_reference: string | null
  is_answered: boolean
  answered_at: string | null
  answered_notes: string | null
  created_at: string
}

export interface PrayerStreak {
  id: string
  church_id: string
  profile_id: string
  current_streak: number
  longest_streak: number
  last_prayer_date: string | null
  weekly_minutes: number
  monthly_minutes: number
  weekly_prayers: number
  monthly_prayers: number
  weekly_people_prayed: number
  monthly_people_prayed: number
  week_start: string | null
  month_start: string | null
}

export interface PrayerReport {
  id: string
  church_id: string
  profile_id: string
  report_type: 'WEEKLY' | 'MONTHLY'
  report_period_start: string
  report_period_end: string
  total_prayers: number
  total_minutes: number
  total_people_prayed: number
  total_answered_prayers: number
  longest_session_minutes: number
  top_motivos: Array<{ content: string; count: number }>
  top_pessoas: Array<{ name: string; count: number }>
  ai_summary: string | null
  ai_encouragement: string | null
  highlight_verses: Array<{ reference: string; text: string }>
  share_token: string | null
  is_shared: boolean
  created_at: string
}

// =====================================================
// PRAYER RECORDING & TRANSCRIPTION
// =====================================================

/**
 * Create a new prayer record and get a signed URL for audio upload
 */
export async function createPrayerRecord(durationSeconds: number) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Create prayer record
    const { data: prayer, error: createError } = await supabase
      .from('prayers')
      .insert({
        church_id: profile.church_id,
        profile_id: profile.id,
        audio_duration_seconds: durationSeconds,
        transcription_status: 'PENDING',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating prayer:', createError)
      return { success: false, error: 'Erro ao criar registro de oração' }
    }

    // Generate signed upload URL
    const filePath = `${profile.id}/${prayer.id}.webm`
    const { data: uploadUrl, error: urlError } = await supabase.storage
      .from('prayer-audio')
      .createSignedUploadUrl(filePath)

    if (urlError) {
      console.error('Error creating upload URL:', urlError)
      return { success: false, error: 'Erro ao criar URL de upload' }
    }

    return {
      success: true,
      prayerId: prayer.id,
      uploadUrl: uploadUrl.signedUrl,
      uploadPath: filePath,
    }
  } catch (error) {
    console.error('Error in createPrayerRecord:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Confirm audio upload and start transcription
 */
export async function confirmAudioUpload(prayerId: string, audioPath: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get the audio URL
    const { data: urlData } = supabase.storage
      .from('prayer-audio')
      .getPublicUrl(audioPath)

    // Update prayer with audio URL
    const { error: updateError } = await supabase
      .from('prayers')
      .update({
        audio_url: urlData.publicUrl,
        transcription_status: 'PROCESSING',
      })
      .eq('id', prayerId)
      .eq('profile_id', profile.id)

    if (updateError) {
      console.error('Error updating prayer:', updateError)
      return { success: false, error: 'Erro ao atualizar registro' }
    }

    // Start transcription in background
    transcribePrayer(prayerId).catch(console.error)

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true }
  } catch (error) {
    console.error('Error in confirmAudioUpload:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Transcribe prayer audio using OpenAI Whisper
 */
export async function transcribePrayer(prayerId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get prayer record
    const { data: prayer, error: fetchError } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', prayerId)
      .eq('profile_id', profile.id)
      .single()

    if (fetchError || !prayer) {
      console.error('Prayer not found:', fetchError)
      return { success: false, error: 'Oração não encontrada' }
    }

    if (!prayer.audio_url) {
      return { success: false, error: 'Áudio não encontrado' }
    }

    // Download audio file
    const audioPath = `${profile.id}/${prayerId}.webm`
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('prayer-audio')
      .download(audioPath)

    if (downloadError || !audioData) {
      console.error('Error downloading audio:', downloadError)
      await supabase
        .from('prayers')
        .update({ transcription_status: 'FAILED' })
        .eq('id', prayerId)
      return { success: false, error: 'Erro ao baixar áudio' }
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe using Whisper
    const transcription = await OpenAIService.transcribeAudio(buffer, 'prayer.webm')

    // Update prayer with transcription
    await supabase
      .from('prayers')
      .update({
        transcription,
        transcription_status: 'COMPLETED',
      })
      .eq('id', prayerId)

    // Analyze prayer content
    await analyzePrayerContent(prayerId)

    revalidatePath('/membro/biblia-oracao/oracao')
    revalidatePath(`/membro/biblia-oracao/oracao/${prayerId}`)

    return { success: true, transcription }
  } catch (error) {
    console.error('Error transcribing prayer:', error)

    const supabase = await createClient()
    await supabase
      .from('prayers')
      .update({ transcription_status: 'FAILED' })
      .eq('id', prayerId)

    return { success: false, error: 'Erro na transcrição' }
  }
}

/**
 * Analyze prayer content and extract categories
 */
export async function analyzePrayerContent(prayerId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get prayer with transcription
    const { data: prayer, error: fetchError } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', prayerId)
      .eq('profile_id', profile.id)
      .single()

    if (fetchError || !prayer || !prayer.transcription) {
      return { success: false, error: 'Transcrição não encontrada' }
    }

    // Analyze with GPT
    const analysis = await OpenAIService.analyzePrayer(prayer.transcription)

    // Update prayer with AI analysis
    await supabase
      .from('prayers')
      .update({
        ai_summary: analysis.summary,
        suggested_verses: analysis.suggested_verses,
      })
      .eq('id', prayerId)

    // Insert prayer items
    const items = [
      ...analysis.motivos.map((m) => ({
        church_id: profile.church_id,
        prayer_id: prayerId,
        profile_id: profile.id,
        item_type: 'MOTIVO' as const,
        content: m.content,
      })),
      ...analysis.promessas.map((p) => ({
        church_id: profile.church_id,
        prayer_id: prayerId,
        profile_id: profile.id,
        item_type: 'PROMESSA' as const,
        content: p.content,
        verse_reference: p.verse_reference || null,
      })),
      ...analysis.transformacoes.map((t) => ({
        church_id: profile.church_id,
        prayer_id: prayerId,
        profile_id: profile.id,
        item_type: 'TRANSFORMACAO' as const,
        content: t.content,
      })),
      ...analysis.pessoas.map((p) => ({
        church_id: profile.church_id,
        prayer_id: prayerId,
        profile_id: profile.id,
        item_type: 'PESSOA' as const,
        content: p.reason || 'Intercessão',
        person_name: p.name,
      })),
    ]

    if (items.length > 0) {
      await supabase.from('prayer_items').insert(items)
    }

    revalidatePath(`/membro/biblia-oracao/oracao/${prayerId}`)

    return { success: true, analysis }
  } catch (error) {
    console.error('Error analyzing prayer:', error)
    return { success: false, error: 'Erro na análise' }
  }
}

// =====================================================
// PRAYER ITEM MANAGEMENT
// =====================================================

/**
 * Mark a prayer item as answered
 */
export async function markPrayerItemAnswered(
  itemId: string,
  notes?: string
) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('prayer_items')
      .update({
        is_answered: true,
        answered_at: new Date().toISOString(),
        answered_notes: notes || null,
      })
      .eq('id', itemId)
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error marking item answered:', error)
      return { success: false, error: 'Erro ao atualizar item' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true }
  } catch (error) {
    console.error('Error in markPrayerItemAnswered:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Mark a prayer as blessing received
 */
export async function markBlessingReceived(
  prayerId: string,
  notes?: string
) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('prayers')
      .update({
        blessing_received: true,
        blessing_received_at: new Date().toISOString(),
        blessing_notes: notes || null,
      })
      .eq('id', prayerId)
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error marking blessing received:', error)
      return { success: false, error: 'Erro ao atualizar oração' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')
    revalidatePath(`/membro/biblia-oracao/oracao/${prayerId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in markBlessingReceived:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =====================================================
// PRAYER HISTORY & STATS
// =====================================================

/**
 * Get prayer history with pagination
 */
export async function getPrayerHistory(page: number = 1, limit: number = 10) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()
    const offset = (page - 1) * limit

    const { data: prayers, error, count } = await supabase
      .from('prayers')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching prayer history:', error)
      return { success: false, error: 'Erro ao buscar histórico' }
    }

    return {
      success: true,
      prayers: prayers as Prayer[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    console.error('Error in getPrayerHistory:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get prayer detail with items
 */
export async function getPrayerDetail(prayerId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Get prayer
    const { data: prayer, error: prayerError } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', prayerId)
      .eq('profile_id', profile.id)
      .single()

    if (prayerError || !prayer) {
      return { success: false, error: 'Oração não encontrada' }
    }

    // Get prayer items
    const { data: items, error: itemsError } = await supabase
      .from('prayer_items')
      .select('*')
      .eq('prayer_id', prayerId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching prayer items:', itemsError)
    }

    return {
      success: true,
      prayer: prayer as Prayer,
      items: (items || []) as PrayerItem[],
    }
  } catch (error) {
    console.error('Error in getPrayerDetail:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get user's prayer streak and stats
 */
export async function getPrayerStreak() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: streak, error } = await supabase
      .from('prayer_streaks')
      .select('*')
      .eq('profile_id', profile.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error)
      return { success: false, error: 'Erro ao buscar sequência' }
    }

    // Return default values if no streak record exists
    const defaultStreak: PrayerStreak = {
      id: '',
      church_id: profile.church_id,
      profile_id: profile.id,
      current_streak: 0,
      longest_streak: 0,
      last_prayer_date: null,
      weekly_minutes: 0,
      monthly_minutes: 0,
      weekly_prayers: 0,
      monthly_prayers: 0,
      weekly_people_prayed: 0,
      monthly_people_prayed: 0,
      week_start: null,
      month_start: null,
    }

    return {
      success: true,
      streak: (streak || defaultStreak) as PrayerStreak,
    }
  } catch (error) {
    console.error('Error in getPrayerStreak:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get prayer statistics for a period
 */
export async function getPrayerStats(period: 'week' | 'month') {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Calculate date range
    const now = new Date()
    let startDate: Date

    if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
    }

    // Get prayers in period
    const { data: prayers, error: prayersError } = await supabase
      .from('prayers')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (prayersError) {
      console.error('Error fetching prayers:', prayersError)
      return { success: false, error: 'Erro ao buscar estatísticas' }
    }

    // Get answered items in period
    const { data: answeredItems, error: itemsError } = await supabase
      .from('prayer_items')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_answered', true)
      .gte('answered_at', startDate.toISOString())

    if (itemsError) {
      console.error('Error fetching answered items:', itemsError)
    }

    // Get people prayed for
    const { data: peopleItems, error: peopleError } = await supabase
      .from('prayer_items')
      .select('person_name')
      .eq('profile_id', profile.id)
      .eq('item_type', 'PESSOA')
      .gte('created_at', startDate.toISOString())

    if (peopleError) {
      console.error('Error fetching people items:', peopleError)
    }

    // Calculate stats
    const totalPrayers = prayers?.length || 0
    const totalMinutes = (prayers || []).reduce(
      (sum, p) => sum + Math.round((p.audio_duration_seconds || 0) / 60),
      0
    )
    const answeredPrayers = answeredItems?.length || 0
    const peoplePrayed = new Set(
      (peopleItems || []).map((p) => p.person_name).filter(Boolean)
    ).size
    const blessingsReceived = (prayers || []).filter(
      (p) => p.blessing_received
    ).length

    return {
      success: true,
      stats: {
        period,
        totalPrayers,
        totalMinutes,
        answeredPrayers,
        peoplePrayed,
        blessingsReceived,
        prayers: prayers as Prayer[],
      },
    }
  } catch (error) {
    console.error('Error in getPrayerStats:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =====================================================
// PRAYER REPORTS
// =====================================================

/**
 * Generate a prayer report (weekly or monthly)
 */
export async function generatePrayerReport(type: 'WEEKLY' | 'MONTHLY') {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Calculate period
    const now = new Date()
    let periodStart: Date
    const periodEnd = now

    if (type === 'WEEKLY') {
      periodStart = new Date(now)
      periodStart.setDate(now.getDate() - 7)
    } else {
      periodStart = new Date(now)
      periodStart.setMonth(now.getMonth() - 1)
    }

    // Get stats for the period
    const statsResult = await getPrayerStats(type === 'WEEKLY' ? 'week' : 'month')
    if (!statsResult.success || !statsResult.stats) {
      return { success: false, error: 'Erro ao gerar estatísticas' }
    }

    const { stats } = statsResult

    // Get top motivos
    const { data: topMotivos } = await supabase
      .from('prayer_items')
      .select('content')
      .eq('profile_id', profile.id)
      .eq('item_type', 'MOTIVO')
      .gte('created_at', periodStart.toISOString())

    // Get top pessoas
    const { data: topPessoas } = await supabase
      .from('prayer_items')
      .select('person_name')
      .eq('profile_id', profile.id)
      .eq('item_type', 'PESSOA')
      .gte('created_at', periodStart.toISOString())

    // Get prayer summaries for AI encouragement
    const summaries = (stats.prayers || [])
      .filter((p) => p.ai_summary)
      .map((p) => p.ai_summary as string)
      .slice(0, 5)

    // Generate AI encouragement
    let aiEncouragement = ''
    try {
      aiEncouragement = await OpenAIService.generateEncouragement(summaries, {
        totalPrayers: stats.totalPrayers,
        streak: 0, // Will be updated from streak table
        peoplesPrayed: stats.peoplePrayed,
        answeredPrayers: stats.answeredPrayers,
      })
    } catch (e) {
      console.error('Error generating encouragement:', e)
    }

    // Count motivos
    const motivosCounts: Record<string, number> = {}
    ;(topMotivos || []).forEach((m) => {
      const key = m.content.substring(0, 50)
      motivosCounts[key] = (motivosCounts[key] || 0) + 1
    })

    // Count pessoas
    const pessoasCounts: Record<string, number> = {}
    ;(topPessoas || []).forEach((p) => {
      if (p.person_name) {
        pessoasCounts[p.person_name] = (pessoasCounts[p.person_name] || 0) + 1
      }
    })

    // Generate share token
    const shareToken = crypto.randomUUID()

    // Find longest session
    const longestSession = Math.max(
      ...stats.prayers.map((p) => Math.round((p.audio_duration_seconds || 0) / 60)),
      0
    )

    // Create report
    const { data: report, error: createError } = await supabase
      .from('prayer_reports')
      .insert({
        church_id: profile.church_id,
        profile_id: profile.id,
        report_type: type,
        report_period_start: periodStart.toISOString().split('T')[0],
        report_period_end: periodEnd.toISOString().split('T')[0],
        total_prayers: stats.totalPrayers,
        total_minutes: stats.totalMinutes,
        total_people_prayed: stats.peoplePrayed,
        total_answered_prayers: stats.answeredPrayers,
        longest_session_minutes: longestSession,
        top_motivos: Object.entries(motivosCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([content, count]) => ({ content, count })),
        top_pessoas: Object.entries(pessoasCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        ai_encouragement: aiEncouragement,
        share_token: shareToken,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating report:', createError)
      return { success: false, error: 'Erro ao criar relatório' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/relatorios')

    return { success: true, report: report as PrayerReport }
  } catch (error) {
    console.error('Error in generatePrayerReport:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get the latest report of a type
 */
export async function getLatestReport(type: 'WEEKLY' | 'MONTHLY') {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from('prayer_reports')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('report_type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching report:', error)
      return { success: false, error: 'Erro ao buscar relatório' }
    }

    return { success: true, report: report as PrayerReport | null }
  } catch (error) {
    console.error('Error in getLatestReport:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Share a prayer report (make it public)
 */
export async function sharePrayerReport(reportId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from('prayer_reports')
      .update({ is_shared: true })
      .eq('id', reportId)
      .eq('profile_id', profile.id)
      .select('share_token')
      .single()

    if (error) {
      console.error('Error sharing report:', error)
      return { success: false, error: 'Erro ao compartilhar relatório' }
    }

    return { success: true, shareToken: report.share_token }
  } catch (error) {
    console.error('Error in sharePrayerReport:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get a shared report by token (public access)
 */
export async function getSharedReport(shareToken: string) {
  try {
    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from('prayer_reports')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_shared', true)
      .single()

    if (error) {
      return { success: false, error: 'Relatório não encontrado' }
    }

    return { success: true, report: report as PrayerReport }
  } catch (error) {
    console.error('Error in getSharedReport:', error)
    return { success: false, error: 'Erro interno' }
  }
}

// =====================================================
// DELETE PRAYER
// =====================================================

/**
 * Delete a prayer and its associated items
 */
export async function deletePrayer(prayerId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    // Delete audio file
    const audioPath = `${profile.id}/${prayerId}.webm`
    await supabase.storage.from('prayer-audio').remove([audioPath])

    // Delete prayer (items will cascade)
    const { error } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId)
      .eq('profile_id', profile.id)

    if (error) {
      console.error('Error deleting prayer:', error)
      return { success: false, error: 'Erro ao excluir oração' }
    }

    revalidatePath('/membro/biblia-oracao/oracao')

    return { success: true }
  } catch (error) {
    console.error('Error in deletePrayer:', error)
    return { success: false, error: 'Erro interno' }
  }
}
