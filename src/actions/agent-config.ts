'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type AgentTone = 'formal' | 'casual' | 'friendly' | 'professional'
export type AgentLanguageStyle = 'direct' | 'detailed' | 'encouraging'
export type AgentEmojiUsage = 'none' | 'minimal' | 'moderate' | 'frequent'

export interface AgentConfig {
  id: string
  church_id: string

  // Personality
  agent_name: string
  tone: AgentTone
  language_style: AgentLanguageStyle
  emoji_usage: AgentEmojiUsage

  // Working Hours
  working_hours_enabled: boolean
  working_hours_start: string
  working_hours_end: string
  working_days: number[]
  timezone: string

  // Automated Messages
  outside_hours_message: string
  first_contact_message: string
  fallback_message: string

  // Automations
  auto_birthday_enabled: boolean
  auto_birthday_time: string
  auto_event_reminder_enabled: boolean
  auto_event_reminder_hours: number
  auto_welcome_enabled: boolean
  auto_absence_followup_enabled: boolean
  auto_absence_followup_days: number

  // Timestamps
  created_at: string
  updated_at: string
}

// Default configuration
const DEFAULT_CONFIG: Omit<AgentConfig, 'id' | 'church_id' | 'created_at' | 'updated_at'> = {
  agent_name: 'Assistente Ekkle',
  tone: 'friendly',
  language_style: 'encouraging',
  emoji_usage: 'moderate',
  working_hours_enabled: false,
  working_hours_start: '08:00',
  working_hours_end: '18:00',
  working_days: [1, 2, 3, 4, 5],
  timezone: 'America/Sao_Paulo',
  outside_hours_message: 'Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Deixe sua mensagem que responderemos assim que possível. Que Deus abençoe! 🙏',
  first_contact_message: 'Olá! Sou o assistente virtual da igreja. Como posso ajudá-lo hoje?',
  fallback_message: 'Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente em alguns instantes.',
  auto_birthday_enabled: true,
  auto_birthday_time: '09:00',
  auto_event_reminder_enabled: true,
  auto_event_reminder_hours: 24,
  auto_welcome_enabled: true,
  auto_absence_followup_enabled: false,
  auto_absence_followup_days: 14,
}

/**
 * Get or create agent configuration for the current user's church
 */
export async function getAgentConfig(): Promise<AgentConfig | null> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('[Agent Config] User not authenticated')
    return null
  }

  // Get user's profile to get church_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.church_id) {
    console.error('[Agent Config] Profile not found')
    return null
  }

  // Try to get existing config
  const { data: existingConfig, error: configError } = await supabase
    .from('church_agent_config')
    .select('*')
    .eq('church_id', profile.church_id)
    .single()

  if (existingConfig) {
    return existingConfig as AgentConfig
  }

  // Config doesn't exist - create with defaults (only pastors can create)
  if (profile.role !== 'PASTOR') {
    console.error('[Agent Config] Only pastors can create config')
    return null
  }

  const { data: newConfig, error: createError } = await supabase
    .from('church_agent_config')
    .insert({
      church_id: profile.church_id,
      ...DEFAULT_CONFIG,
    })
    .select()
    .single()

  if (createError) {
    console.error('[Agent Config] Error creating config:', createError)
    return null
  }

  return newConfig as AgentConfig
}

/**
 * Get agent configuration by church ID (for use in message processor)
 */
export async function getAgentConfigByChurchId(churchId: string): Promise<AgentConfig | null> {
  const supabase = await createClient()

  const { data: config, error } = await supabase
    .from('church_agent_config')
    .select('*')
    .eq('church_id', churchId)
    .single()

  if (error || !config) {
    return null
  }

  return config as AgentConfig
}

/**
 * Update agent configuration
 */
export async function updateAgentConfig(
  updates: Partial<Omit<AgentConfig, 'id' | 'church_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.church_id) {
    return { success: false, error: 'Perfil não encontrado' }
  }

  // Only pastors can update
  if (profile.role !== 'PASTOR') {
    return { success: false, error: 'Apenas pastores podem atualizar as configurações' }
  }

  // Update config
  const { error: updateError } = await supabase
    .from('church_agent_config')
    .update(updates)
    .eq('church_id', profile.church_id)

  if (updateError) {
    console.error('[Agent Config] Error updating config:', updateError)
    return { success: false, error: 'Erro ao atualizar configurações' }
  }

  revalidatePath('/dashboard/comunicacoes')
  return { success: true }
}

/**
 * Check if current time is within working hours for a church
 */
export async function isWithinWorkingHours(churchId: string): Promise<boolean> {
  const config = await getAgentConfigByChurchId(churchId)

  if (!config || !config.working_hours_enabled) {
    return true // If disabled, always within hours
  }

  const now = new Date()

  // Get current time in church's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const weekday = parts.find(p => p.type === 'weekday')?.value || ''

  // Map weekday to number (0 = Sunday, 1 = Monday, etc.)
  const weekdayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  }
  const dayOfWeek = weekdayMap[weekday] ?? 0

  // Check if today is a working day
  if (!config.working_days.includes(dayOfWeek)) {
    return false
  }

  // Parse working hours
  const [startHour, startMinute] = config.working_hours_start.split(':').map(Number)
  const [endHour, endMinute] = config.working_hours_end.split(':').map(Number)

  const currentMinutes = hour * 60 + minute
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Get the outside hours message for a church
 */
export async function getOutsideHoursMessage(churchId: string): Promise<string | null> {
  const config = await getAgentConfigByChurchId(churchId)

  if (!config || !config.working_hours_enabled) {
    return null
  }

  return config.outside_hours_message
}
