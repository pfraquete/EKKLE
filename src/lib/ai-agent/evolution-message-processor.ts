/**
 * Evolution API Message Processor
 *
 * Handles AI agent responses for messages received via Evolution API.
 * This is a simplified version that processes incoming messages and generates
 * AI responses using OpenAI.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { EvolutionService } from '@/lib/evolution'

// Types
interface AgentConfig {
    id: string
    church_id: string
    agent_name: string
    tone: string
    language_style: string
    emoji_usage: string
    working_hours_enabled: boolean
    working_hours_start: string
    working_hours_end: string
    working_days: number[]
    timezone: string
    outside_hours_message: string
    first_contact_message: string
    fallback_message: string
    church_address: string
    church_city: string
    church_state: string
    church_phone: string
    church_email: string
    service_times: { day: string; time: string; name: string }[]
    leaders_contacts: { name: string; role: string; phone: string; area: string }[]
    custom_info: string
}

interface ProcessMessageInput {
    churchId: string
    instanceName: string
    phoneNumber: string
    message: string
    senderName: string
}

/**
 * Get Supabase client
 */
function getSupabaseClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase configuration is missing')
    }

    return createClient(url, key)
}

/**
 * Check if current time is within working hours
 */
function isWithinWorkingHours(config: AgentConfig): boolean {
    if (!config.working_hours_enabled) {
        return true
    }

    const now = new Date()
    
    // Get current time in church's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: config.timezone || 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
    })

    const parts = formatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const weekday = parts.find(p => p.type === 'weekday')?.value || ''

    // Map weekday to number
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

    // Handle overnight hours (e.g., 01:00 to 00:59)
    if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Build system prompt based on agent configuration
 */
function buildSystemPrompt(config: AgentConfig): string {
    const toneMap: Record<string, string> = {
        formal: 'formal e respeitoso',
        casual: 'casual e descontraído',
        friendly: 'amigável e acolhedor',
        professional: 'profissional e objetivo'
    }

    const styleMap: Record<string, string> = {
        direct: 'direto e objetivo',
        detailed: 'detalhado e explicativo',
        encouraging: 'encorajador e motivacional'
    }

    const emojiMap: Record<string, string> = {
        none: 'Não use emojis.',
        minimal: 'Use emojis com moderação, apenas quando muito relevante.',
        moderate: 'Use emojis ocasionalmente para tornar a conversa mais agradável.',
        frequent: 'Use emojis frequentemente para tornar a conversa mais expressiva.'
    }

    let prompt = `Você é ${config.agent_name}, o assistente virtual da igreja.

PERSONALIDADE:
- Tom de comunicação: ${toneMap[config.tone] || 'amigável e acolhedor'}
- Estilo de linguagem: ${styleMap[config.language_style] || 'encorajador e motivacional'}
- ${emojiMap[config.emoji_usage] || 'Use emojis ocasionalmente.'}

INFORMAÇÕES DA IGREJA:`

    if (config.church_address) {
        prompt += `\n- Endereço: ${config.church_address}, ${config.church_city}/${config.church_state}`
    }
    if (config.church_phone) {
        prompt += `\n- Telefone: ${config.church_phone}`
    }
    if (config.church_email) {
        prompt += `\n- Email: ${config.church_email}`
    }

    if (config.service_times && config.service_times.length > 0) {
        prompt += '\n\nHORÁRIOS DOS CULTOS:'
        for (const service of config.service_times) {
            prompt += `\n- ${service.name}: ${service.day} às ${service.time}`
        }
    }

    if (config.leaders_contacts && config.leaders_contacts.length > 0) {
        prompt += '\n\nCONTATOS DOS LÍDERES:'
        for (const leader of config.leaders_contacts) {
            prompt += `\n- ${leader.name} (${leader.role}${leader.area ? ` - ${leader.area}` : ''}): ${leader.phone}`
        }
    }

    if (config.custom_info) {
        prompt += `\n\nINFORMAÇÕES ADICIONAIS:\n${config.custom_info}`
    }

    prompt += `

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Seja prestativo e acolhedor
- Se não souber uma informação, diga que vai verificar e retornar
- Para assuntos urgentes, sugira entrar em contato pelo telefone da igreja
- Mantenha as respostas concisas e objetivas (máximo 3-4 parágrafos)
- Não invente informações que não foram fornecidas`

    return prompt
}

/**
 * Call OpenAI API to generate response
 */
async function generateAIResponse(systemPrompt: string, userMessage: string, conversationHistory: { role: string; content: string }[]): Promise<string> {
    const openaiApiKey = process.env.OPENAI_API_KEY
    const openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

    if (!openaiApiKey) {
        throw new Error('OpenAI API key is missing')
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage }
    ]

    const response = await fetch(`${openaiApiBase}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 500
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('[AI Agent] OpenAI API error:', error)
        throw new Error('Failed to generate AI response')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}

/**
 * Get or create conversation history
 */
async function getConversationHistory(supabase: SupabaseClient, churchId: string, phoneNumber: string): Promise<{ role: string; content: string }[]> {
    // Try to get recent messages from whatsapp_messages table
    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('direction, content, sent_at')
        .eq('church_id', churchId)
        .or(`from_number.eq.${phoneNumber},to_number.eq.${phoneNumber}`)
        .order('sent_at', { ascending: true })
        .limit(20)

    if (!messages || messages.length === 0) {
        return []
    }

    return messages.map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content || ''
    }))
}

/**
 * Process incoming message and generate AI response
 */
export async function processEvolutionMessage(input: ProcessMessageInput): Promise<{ success: boolean; response?: string; error?: string }> {
    const { churchId, instanceName, phoneNumber, message, senderName } = input

    console.log(`[Evolution AI Agent] Processing message from ${phoneNumber}`)
    console.log(`[Evolution AI Agent] Message: ${message}`)

    try {
        const supabase = getSupabaseClient()

        // Get agent configuration
        const { data: agentConfig, error: configError } = await supabase
            .from('church_agent_config')
            .select('*')
            .eq('church_id', churchId)
            .single()

        if (configError || !agentConfig) {
            console.log('[Evolution AI Agent] No agent config found for church')
            return { success: false, error: 'Agent not configured' }
        }

        // Check if agent is active
        if (agentConfig.is_active === false) {
            console.log('[Evolution AI Agent] Agent is disabled for this church')
            return { success: false, error: 'Agent is disabled' }
        }

        // Check working hours
        if (!isWithinWorkingHours(agentConfig)) {
            console.log('[Evolution AI Agent] Outside working hours')
            
            // Send outside hours message
            await EvolutionService.sendText(instanceName, phoneNumber, agentConfig.outside_hours_message)
            
            return { success: true, response: agentConfig.outside_hours_message }
        }

        // Get conversation history
        const conversationHistory = await getConversationHistory(supabase, churchId, phoneNumber)

        // Build system prompt
        const systemPrompt = buildSystemPrompt(agentConfig)

        // Generate AI response
        let aiResponse: string
        try {
            aiResponse = await generateAIResponse(systemPrompt, message, conversationHistory)
        } catch (error) {
            console.error('[Evolution AI Agent] Error generating AI response:', error)
            aiResponse = agentConfig.fallback_message
        }

        if (!aiResponse) {
            aiResponse = agentConfig.fallback_message
        }

        console.log(`[Evolution AI Agent] Generated response: ${aiResponse}`)

        // Send response via Evolution API
        await EvolutionService.sendText(instanceName, phoneNumber, aiResponse)

        // Store the AI response in database
        const { data: instanceData } = await supabase
            .from('whatsapp_instances')
            .select('phone_number')
            .eq('instance_name', instanceName)
            .single()

        await supabase
            .from('whatsapp_messages')
            .insert({
                church_id: churchId,
                instance_name: instanceName,
                direction: 'outbound',
                from_number: instanceData?.phone_number || '',
                to_number: phoneNumber,
                message_type: 'text',
                content: aiResponse,
                status: 'sent',
                sent_at: new Date().toISOString()
            })

        console.log('[Evolution AI Agent] Response sent successfully')

        return { success: true, response: aiResponse }
    } catch (error: any) {
        console.error('[Evolution AI Agent] Error processing message:', error)
        return { success: false, error: error.message }
    }
}
