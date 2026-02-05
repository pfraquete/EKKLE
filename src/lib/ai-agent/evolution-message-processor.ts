/**
 * Evolution API Message Processor - Enterprise Edition
 *
 * Processador de mensagens com function calling real para o agente de WhatsApp.
 * Implementa o melhor agente de WhatsApp para igrejas do mercado.
 *
 * Funcionalidades:
 * - Function calling real com OpenAI
 * - Histórico de conversa funcional
 * - Respostas sobre a igreja (horários, endereço, contatos)
 * - Cadastro de visitantes via WhatsApp
 * - Pedidos de oração
 * - Encaminhamento para humano quando necessário
 * - Rate limiting e proteção contra spam
 *
 * @author Ekkle Team
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { EvolutionService } from '@/lib/evolution'
import { executeFunctionCall, FunctionExecutionResult } from './function-executor'

// ============================================================================
// TYPES
// ============================================================================

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
  greeting_style: 'graca_paz' | 'paz_senhor' | 'ola' | 'custom'
  custom_greeting: string
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
  is_active: boolean
}

interface ProcessMessageInput {
  churchId: string
  instanceName: string
  phoneNumber: string
  message: string
  senderName: string
  messageId?: string
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  role: string
  member_stage: string | null
  birth_date: string | null
  cell_id: string | null
  is_active: boolean
  cell?: {
    name: string
    leader?: { full_name: string }
  } | null
}

interface OpenAIFunctionCall {
  name: string
  arguments: string
}

interface OpenAIMessage {
  role: string
  content: string | null
  function_call?: OpenAIFunctionCall
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FUNCTION_CALLS = 5 // Limite de chamadas de função por mensagem
const MAX_HISTORY_MESSAGES = 20 // Mensagens de histórico para contexto
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minuto
const RATE_LIMIT_MAX_MESSAGES = 10 // Máximo de mensagens por minuto

// Cache de rate limiting (em produção, usar Redis)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Check rate limit for a phone number
 */
function checkRateLimit(phoneNumber: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = phoneNumber
  const limit = rateLimitCache.get(key)

  if (!limit || now > limit.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (limit.count >= RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, retryAfter: Math.ceil((limit.resetAt - now) / 1000) }
  }

  limit.count++
  return { allowed: true }
}

/**
 * Check if current time is within working hours
 */
function isWithinWorkingHours(config: AgentConfig): boolean {
  if (!config.working_hours_enabled) {
    return true
  }

  const now = new Date()

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

  const weekdayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  }
  const dayOfWeek = weekdayMap[weekday] ?? 0

  if (!config.working_days.includes(dayOfWeek)) {
    return false
  }

  const [startHour, startMinute] = config.working_hours_start.split(':').map(Number)
  const [endHour, endMinute] = config.working_hours_end.split(':').map(Number)

  const currentMinutes = hour * 60 + minute
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Detect user intent from message
 */
function detectIntent(message: string): {
  type: 'greeting' | 'question' | 'prayer_request' | 'visitor_registration' | 'human_request' | 'name_response' | 'general'
  confidence: number
  extractedName?: string
} {
  const lowerMessage = message.toLowerCase().trim()
  const originalMessage = message.trim()

  // PRIMEIRO: Verificar saudações (antes de detectar nomes para evitar "Oi" ser detectado como nome)
  const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eai', 'e ai', 'oie', 'opa', 'eae', 'fala', 'salve', 'alo', 'alô']
  if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' ') || lowerMessage.startsWith(g + ','))) {
    return { type: 'greeting', confidence: 0.9 }
  }

  // Lista de palavras comuns que NÃO são nomes
  const notNames = [
    'oi', 'olá', 'ola', 'bom', 'boa', 'dia', 'tarde', 'noite', 'hey', 'eai', 'oie', 'opa', 'eae', 'fala', 'salve', 'alo', 'alô',
    'sim', 'não', 'nao', 'ok', 'tudo', 'bem', 'obrigado', 'obrigada', 'valeu', 'brigado', 'brigada',
    'quero', 'preciso', 'gostaria', 'poderia', 'pode', 'tem', 'onde', 'quando', 'como', 'qual', 'quem',
    'célula', 'celula', 'culto', 'igreja', 'pastor', 'líder', 'lider', 'oração', 'oracao',
    'horário', 'horario', 'endereço', 'endereco', 'informação', 'informacao', 'ajuda'
  ]

  // Name response patterns - detectar quando usuário responde com nome
  // Padrões: "Me chamo Maria", "Sou o João", "Meu nome é Ana"
  const namePatterns = [
    /^me\s+chamo\s+(.+)$/i,
    /^meu\s+nome\s+é\s+(.+)$/i,
    /^pode\s+me\s+chamar\s+de\s+(.+)$/i,
  ]
  
  for (const pattern of namePatterns) {
    const match = originalMessage.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      // Validar que parece um nome (1-4 palavras, sem números, não é palavra comum)
      if (
        name.length >= 2 && 
        name.length <= 50 && 
        !/\d/.test(name) && 
        name.split(/\s+/).length <= 4 &&
        !notNames.includes(name.toLowerCase())
      ) {
        return { type: 'name_response', confidence: 0.95, extractedName: name }
      }
    }
  }

  // Padrão "Sou X" - mais restritivo para evitar "Sou novo", "Sou da igreja", etc.
  const souMatch = originalMessage.match(/^sou\s+(?:o|a)?\s*(.+)$/i)
  if (souMatch && souMatch[1]) {
    const name = souMatch[1].trim()
    // Só aceitar se for 1-2 palavras e começar com maiúscula (parece nome próprio)
    if (
      name.length >= 2 && 
      name.length <= 30 && 
      !/\d/.test(name) && 
      name.split(/\s+/).length <= 2 &&
      /^[A-ZÀ-Ü]/.test(name) &&
      !notNames.includes(name.toLowerCase().split(/\s+/)[0])
    ) {
      return { type: 'name_response', confidence: 0.9, extractedName: name }
    }
  }

  // Se a mensagem é curta (1-2 palavras) e parece um nome próprio
  const words = originalMessage.split(/\s+/)
  if (words.length >= 1 && words.length <= 2) {
    const potentialName = originalMessage
    const firstWord = words[0].toLowerCase()
    
    // Verificar se parece um nome: começa com maiúscula, sem números, sem pontuação, não é palavra comum
    if (
      potentialName.length >= 2 && 
      potentialName.length <= 30 &&
      /^[A-ZÀ-Ü]/.test(potentialName) && 
      !/\d/.test(potentialName) &&
      !/[?!@#$%^&*(){}\[\]|\\:";<>,.\/?]/.test(potentialName) &&
      !notNames.includes(firstWord)
    ) {
      return { type: 'name_response', confidence: 0.8, extractedName: potentialName }
    }
  }

  // Prayer request patterns
  const prayerPatterns = ['oração', 'oracao', 'orar', 'ore por', 'preciso de oração', 'pedido de oração', 'interceda', 'intercessão']
  if (prayerPatterns.some(p => lowerMessage.includes(p))) {
    return { type: 'prayer_request', confidence: 0.85 }
  }

  // Visitor registration patterns
  const visitorPatterns = ['quero visitar', 'quero conhecer', 'sou novo', 'sou nova', 'primeira vez', 'nunca fui', 'como faço para ir', 'quero participar']
  if (visitorPatterns.some(p => lowerMessage.includes(p))) {
    return { type: 'visitor_registration', confidence: 0.8 }
  }

  // Human request patterns
  const humanPatterns = ['falar com alguém', 'falar com alguem', 'falar com pastor', 'falar com líder', 'falar com lider', 'atendente', 'humano', 'pessoa real', 'falar com uma pessoa']
  if (humanPatterns.some(p => lowerMessage.includes(p))) {
    return { type: 'human_request', confidence: 0.9 }
  }

  // Question patterns
  const questionPatterns = ['?', 'onde', 'quando', 'qual', 'como', 'quanto', 'quem', 'horário', 'horario', 'endereço', 'endereco', 'localização', 'localizacao']
  if (questionPatterns.some(p => lowerMessage.includes(p))) {
    return { type: 'question', confidence: 0.7 }
  }

  return { type: 'general', confidence: 0.5 }
}

/**
 * Build system prompt based on agent configuration and user profile
 */
function buildSystemPrompt(
  config: AgentConfig, 
  context: { 
    isFirstContact: boolean; 
    senderName: string;
    userProfile?: UserProfile | null;
  }
): string {
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
    none: 'NÃO use emojis em nenhuma circunstância.',
    minimal: 'Use emojis APENAS no final das mensagens, no máximo 1 emoji.',
    moderate: 'Use emojis ocasionalmente (2-3 por mensagem) para tornar a conversa mais agradável.',
    frequent: 'Use emojis frequentemente para tornar a conversa mais expressiva e calorosa.'
  }

  // Determinar saudação baseada na configuração
  const greetingMap: Record<string, string> = {
    'graca_paz': 'Graça e Paz',
    'paz_senhor': 'Paz do Senhor',
    'ola': 'Olá',
    'custom': config.custom_greeting || 'Olá'
  }
  const greeting = greetingMap[config.greeting_style] || 'Graça e Paz'

  let prompt = `Você é um atendente HUMANO da igreja via WhatsApp. Seu nome é ${config.agent_name}.

IMPORTANTE - VOCÊ NÃO É UM ROBÔ:
- NUNCA diga que é um assistente virtual, IA, robô ou chatbot
- NUNCA use frases como "sou o assistente virtual" ou "como assistente"
- Aja como um atendente real da igreja, uma pessoa de verdade
- Seja natural, humano e acolhedor como alguém da equipe de atendimento

SAUDAÇÃO PADRÃO: "${greeting}"
- Use esta saudação ao iniciar conversas ou cumprimentar pessoas
- Varie a forma de usar (ex: "${greeting}!" ou "${greeting}, como posso ajudar?")

PERSONALIDADE:
- Tom: ${toneMap[config.tone] || 'amigável e acolhedor'}
- Estilo: ${styleMap[config.language_style] || 'encorajador e motivacional'}
- ${emojiMap[config.emoji_usage] || 'Use emojis ocasionalmente.'}

INFORMAÇÕES DA IGREJA:`

  if (config.church_address) {
    prompt += `\n📍 Endereço: ${config.church_address}`
    if (config.church_city) prompt += `, ${config.church_city}`
    if (config.church_state) prompt += `/${config.church_state}`
  }
  if (config.church_phone) {
    prompt += `\n📞 Telefone: ${config.church_phone}`
  }
  if (config.church_email) {
    prompt += `\n📧 Email: ${config.church_email}`
  }

  if (config.service_times && config.service_times.length > 0) {
    prompt += '\n\n⛪ HORÁRIOS DOS CULTOS:'
    for (const service of config.service_times) {
      prompt += `\n- ${service.name}: ${service.day} às ${service.time}`
    }
  }

  if (config.leaders_contacts && config.leaders_contacts.length > 0) {
    prompt += '\n\n👥 LÍDERES DISPONÍVEIS:'
    for (const leader of config.leaders_contacts) {
      prompt += `\n- ${leader.name} (${leader.role}${leader.area ? ` - ${leader.area}` : ''}): ${leader.phone}`
    }
  }

  if (config.custom_info) {
    prompt += `\n\n📋 INFORMAÇÕES ADICIONAIS:\n${config.custom_info}`
  }

  prompt += `

O QUE VOCÊ PODE FAZER:
1. Informar horários de cultos, endereço e como chegar
2. Fornecer contatos de líderes e pastores
3. Receber pedidos de oração (salvar e encaminhar para equipe)
4. Cadastrar visitantes interessados em conhecer a igreja
5. Informar sobre próximos eventos
6. Encaminhar para atendimento humano quando necessário

COMPORTAMENTO COM VISITANTES (NÚMEROS DESCONHECIDOS):
- Se a pessoa NÃO está cadastrada (Membro cadastrado: NÃO), você DEVE perguntar o nome
- Exemplo: "${greeting}! Que bom falar com você! Como posso te chamar?"
- IMPORTANTE: Quando a pessoa responder com um nome (ex: "Pedro", "Maria", "João"), você DEVE:
  1. IMEDIATAMENTE chamar a função register_visitor com o nome informado
  2. Só depois de cadastrar, responder de forma acolhedora
- Se a mensagem contiver APENAS um nome ou "me chamo X" ou "sou X", é uma resposta ao pedido de nome
- Depois de cadastrar, continue ajudando normalmente
- Seja acolhedor e faça a pessoa se sentir bem-vinda

REGRAS DE COMPORTAMENTO:
- Responda SEMPRE em português brasileiro
- Seja natural e humano, como um atendente real
- Respostas curtas e objetivas (máximo 2-3 parágrafos)
- NÃO invente informações - se não souber, diga que vai verificar
- Para assuntos complexos, encaminhe para um líder
- Para pedidos de oração, seja empático e acolhedor
- NUNCA se identifique como robô, IA ou assistente virtual

CONTEXTO DA CONVERSA:
- Nome do contato: ${context.userProfile?.full_name || context.senderName || 'Visitante'}
- Primeiro contato: ${context.isFirstContact ? 'Sim' : 'Não'}
- Membro cadastrado: ${context.userProfile ? 'SIM' : 'NÃO'}`

  // Add user profile information if available
  if (context.userProfile) {
    const profile = context.userProfile
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': 'Super Administrador',
      'ADMIN': 'Administrador',
      'PASTOR': 'Pastor',
      'LEADER': 'Líder',
      'MEMBER': 'Membro',
      'VISITOR': 'Visitante'
    }
    const stageMap: Record<string, string> = {
      'VISITOR': 'Visitante',
      'REGULAR': 'Frequentador',
      'MEMBER': 'Membro',
      'LEADER': 'Líder',
      'INACTIVE': 'Inativo'
    }

    prompt += `\n\n👤 PERFIL DO MEMBRO (CADASTRADO NO SISTEMA):
- Nome completo: ${profile.full_name}
- Função: ${roleMap[profile.role] || profile.role}
- Estágio: ${stageMap[profile.member_stage || ''] || profile.member_stage || 'Não definido'}`

    if (profile.cell) {
      prompt += `\n- Célula: ${profile.cell.name}`
      if (profile.cell.leader) {
        prompt += ` (Líder: ${profile.cell.leader.full_name})`
      }
    }

    if (profile.birth_date) {
      const birthDate = new Date(profile.birth_date)
      const today = new Date()
      const isBirthdayToday = birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth()
      const isBirthdaySoon = !isBirthdayToday && (() => {
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7
      })()
      
      if (isBirthdayToday) {
        prompt += `\n- 🎂 HOJE É ANIVERSÁRIO DELE(A)! Parabenize com carinho!`
      } else if (isBirthdaySoon) {
        prompt += `\n- 🎂 Aniversário em breve (${birthDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`
      }
    }

    prompt += `\n\nIMPORTANTE: Esta pessoa é um membro cadastrado. Trate-a pelo nome e de forma personalizada.`
  }

  if (!context.userProfile) {
    prompt += `\n\n👋 VISITANTE NÃO CADASTRADO - REGRAS OBRIGATÓRIAS:
- Esta pessoa NÃO está cadastrada no sistema
- Se a mensagem atual for um nome (ex: "Pedro", "Maria", "Me chamo João", "Sou Ana"):
  → Você DEVE chamar register_visitor IMEDIATAMENTE com esse nome
  → NÃO responda sem antes cadastrar a pessoa
  → Após cadastrar, cumprimente pelo nome e pergunte como pode ajudar
- Se a mensagem NÃO for um nome, pergunte: "${greeting}! Como posso te chamar?"
- Exemplos de mensagens que SÃO nomes (cadastrar imediatamente):
  "Pedro" → register_visitor(name="Pedro")
  "Me chamo Maria" → register_visitor(name="Maria")
  "Sou o João" → register_visitor(name="João")
  "Ana Paula" → register_visitor(name="Ana Paula")

💬 FLUXO DE CONVERSA COM VISITANTES (após saber o nome):
Seja PESSOAL e ACOLHEDOR! Faça perguntas para conhecer melhor a pessoa:

1. PRIMEIRO: Pergunte se já conhece a igreja
   - "Que bom te conhecer, [nome]! Você já teve a oportunidade de visitar algum culto nosso?"
   - Se SIM: "Que maravilha! O que achou? Ficamos felizes em ter você conosco!"
   - Se NÃO: "Será um prazer te receber! Nossos cultos são [horários]. Posso te contar mais?"

2. DEPOIS: Apresente as células de forma acolhedora
   - "Além dos cultos, temos as células - são grupos pequenos que se reúnem nas casas para estudar a Bíblia, orar e ter comunhão. Você já conhece ou já participou de alguma célula?"
   - Se mostrar interesse: Liste as células disponíveis usando list_cells
   - Explique: "Nas células você pode fazer amizades, crescer na fé e receber apoio de irmãos"

3. OFEREÇA CONTATO PESSOAL:
   - "Se você quiser, posso pedir para um irmão ou irmã da igreja entrar em contato com você para te ajudar a se integrar. O que acha?"
   - Se aceitar: "Perfeito! Vou pedir para [líder mais próximo] entrar em contato com você. Ele(a) vai te ajudar a se sentir em casa!"

4. PERGUNTAS PARA CONHECER MELHOR:
   - "Você mora aqui perto? Posso te indicar uma célula na sua região"
   - "Tem alguma área específica que te interessa? Temos ministérios de louvor, jovens, casais..."
   - "Posso orar por algo específico na sua vida?"

IMPORTANTE:
- NÃO bombardeie com todas as perguntas de uma vez
- Faça UMA pergunta por vez e espere a resposta
- Seja genuinamente interessado na pessoa
- Use o nome da pessoa nas respostas para criar conexão
- Demonstre que a igreja é uma família que quer acolher`
  }

  return prompt
}

/**
 * Get conversation history from database
 */
async function getConversationHistory(
  supabase: SupabaseClient,
  churchId: string,
  phoneNumber: string
): Promise<ConversationMessage[]> {
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('direction, content, sent_at')
    .eq('church_id', churchId)
    .or(`from_number.eq.${phoneNumber},to_number.eq.${phoneNumber}`)
    .order('sent_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES)

  if (error || !messages || messages.length === 0) {
    return []
  }

  return messages
    .filter(msg => msg.content && msg.content.trim())
    .map(msg => ({
      role: (msg.direction === 'INBOUND' || msg.direction === 'inbound') ? 'user' as const : 'assistant' as const,
      content: msg.content
    }))
}

/**
 * Check if this is the first contact from this number
 */
async function isFirstContact(
  supabase: SupabaseClient,
  churchId: string,
  phoneNumber: string
): Promise<boolean> {
  const { count } = await supabase
    .from('whatsapp_messages')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .eq('from_number', phoneNumber)

  return (count || 0) <= 1
}

/**
 * Find user profile by phone number
 * Searches for the phone in multiple formats to ensure a match
 */
async function findUserByPhone(
  supabase: SupabaseClient,
  churchId: string,
  phoneNumber: string
): Promise<UserProfile | null> {
  // Normalize phone number - remove all non-digits
  const normalizedPhone = phoneNumber.replace(/\D/g, '')
  
  // Try different phone formats
  const phoneVariants = [
    normalizedPhone,                          // 5512997781488
    normalizedPhone.slice(-11),               // 12997781488 (without country code)
    normalizedPhone.slice(-10),               // 2997781488 (without country code and area code first digit)
    normalizedPhone.slice(-9),                // 997781488 (just the number)
    `+${normalizedPhone}`,                    // +5512997781488
    `+55${normalizedPhone.slice(-11)}`,       // +5512997781488
  ]

  console.log(`[AI Agent] 🔍 Searching for user with phone variants:`, phoneVariants.slice(0, 3))

  // Search for user with any of the phone variants
  // Use limit(1) instead of single() to avoid error when multiple matches exist
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      email,
      role,
      member_stage,
      birth_date,
      cell_id,
      is_active,
      created_at,
      cell:cells(name, leader:profiles!cells_leader_id_fkey(full_name))
    `)
    .eq('church_id', churchId)
    .eq('is_active', true)
    .or(phoneVariants.map(p => `phone.ilike.%${p.slice(-9)}%`).join(','))
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !profiles || profiles.length === 0) {
    console.log(`[AI Agent] 👤 User not found for phone ${phoneNumber}`)
    return null
  }

  const profile = profiles[0]

  console.log(`[AI Agent] ✅ Found user: ${profile.full_name} (${profile.role})`)
  
  // Transform Supabase response to UserProfile format
  // Supabase returns cell as array, we need to extract first item
  const cellData = Array.isArray(profile.cell) ? profile.cell[0] : profile.cell
  const leaderData = cellData?.leader ? (Array.isArray(cellData.leader) ? cellData.leader[0] : cellData.leader) : undefined
  
  const userProfile: UserProfile = {
    id: profile.id,
    full_name: profile.full_name,
    phone: profile.phone,
    email: profile.email,
    role: profile.role,
    member_stage: profile.member_stage,
    birth_date: profile.birth_date,
    cell_id: profile.cell_id,
    is_active: profile.is_active,
    cell: cellData ? {
      name: cellData.name,
      leader: leaderData ? { full_name: leaderData.full_name } : undefined
    } : undefined
  }
  
  return userProfile
}

/**
 * Get visitor functions for OpenAI - simplified for visitors
 */
function getVisitorFunctions() {
  return [
    {
      name: 'get_church_location',
      description: 'Obtém endereço e localização da igreja. Use quando perguntarem onde fica, como chegar, endereço.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'get_service_times',
      description: 'Obtém horários dos cultos. Use quando perguntarem sobre horários, quando tem culto.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'get_leader_contacts',
      description: 'Obtém contatos de líderes. Use quando quiserem falar com alguém ou participar de célula.',
      parameters: { type: 'object', properties: { area: { type: 'string', description: 'Área/região (opcional)' } } }
    },
    {
      name: 'get_next_events',
      description: 'Obtém próximos eventos e cultos. Use quando perguntarem sobre agenda ou eventos.',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Quantidade (default: 5)' } } }
    },
    {
      name: 'register_visitor',
      description: 'Cadastra um visitante no sistema. OBRIGATÓRIO: Use SEMPRE que uma pessoa não cadastrada informar seu nome (ex: "Pedro", "Maria", "Me chamo João"). Também use quando alguém quiser visitar ou conhecer a igreja.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do visitante (extrair da mensagem)' },
          phone: { type: 'string', description: 'Telefone do visitante (já disponível no contexto)' },
          interest: { type: 'string', description: 'O que motivou o interesse (opcional)' }
        },
        required: ['name']
      }
    },
    {
      name: 'save_prayer_request',
      description: 'Salva um pedido de oração. Use quando alguém pedir oração ou intercessão.',
      parameters: {
        type: 'object',
        properties: {
          requester_name: { type: 'string', description: 'Nome de quem está pedindo' },
          request: { type: 'string', description: 'O pedido de oração' },
          is_urgent: { type: 'boolean', description: 'Se é urgente' }
        },
        required: ['request']
      }
    },
    {
      name: 'request_human_support',
      description: 'Encaminha para atendimento humano. Use quando a pessoa pedir para falar com alguém ou o assunto for complexo.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo do encaminhamento' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridade' }
        },
        required: ['reason']
      }
    }
  ]
}

/**
 * Execute visitor-specific functions
 */
async function executeVisitorFunction(
  functionName: string,
  args: Record<string, any>,
  context: { churchId: string; phoneNumber: string; senderName: string }
): Promise<FunctionExecutionResult> {
  const supabase = getSupabaseClient()

  switch (functionName) {
    case 'register_visitor': {
      // Cadastrar visitante - usa o telefone do contexto automaticamente
      const visitorPhone = context.phoneNumber.replace(/\D/g, '')
      const visitorName = args.name?.trim()
      
      if (!visitorName) {
        console.error('[Visitor Registration] Nome não fornecido')
        return { success: false, error: 'Nome do visitante não foi fornecido.' }
      }

      console.log(`[Visitor Registration] Cadastrando: ${visitorName} - ${visitorPhone}`)

      // Verificar se já existe pelo telefone (usar limit(1) para evitar erro com múltiplos)
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('church_id', context.churchId)
        .ilike('phone', `%${visitorPhone.slice(-9)}%`)
        .order('created_at', { ascending: false })
        .limit(1)
      
      const existing = existingProfiles?.[0]

      if (existing) {
        console.log(`[Visitor Registration] Visitante já existe: ${existing.full_name}`)
        return {
          success: true,
          message: `${visitorName} já está cadastrado(a) como ${existing.full_name}!`,
          data: { alreadyExists: true, existingName: existing.full_name }
        }
      }

      const { data: newProfile, error } = await supabase.from('profiles').insert({
        full_name: visitorName,
        phone: visitorPhone,
        church_id: context.churchId,
        role: 'MEMBER',
        member_stage: 'VISITOR',
        is_active: true
      }).select('id, full_name').single()

      if (error) {
        console.error('[Visitor Registration] Error:', error)
        return { success: false, error: 'Não foi possível realizar o cadastro. Por favor, tente novamente.' }
      }

      console.log(`[Visitor Registration] ✅ Cadastrado com sucesso: ${newProfile?.full_name} (ID: ${newProfile?.id})`)

      return {
        success: true,
        message: `Cadastro realizado! ${visitorName} agora está registrado(a) como visitante.`,
        data: { visitorId: newProfile?.id, name: newProfile?.full_name }
      }
    }

    case 'save_prayer_request': {
      // Salvar pedido de oração
      const { error } = await supabase.from('prayer_requests').insert({
        church_id: context.churchId,
        requester_name: args.requester_name || context.senderName || 'Anônimo',
        requester_phone: context.phoneNumber,
        request: args.request,
        is_urgent: args.is_urgent || false,
        status: 'pending',
        source: 'whatsapp'
      })

      if (error) {
        // Se a tabela não existir, criar uma mensagem amigável
        console.error('[Prayer Request] Error:', error)
        return {
          success: true,
          message: `🙏 Seu pedido de oração foi recebido! Nossa equipe de intercessão irá orar por você. "${args.request.substring(0, 100)}${args.request.length > 100 ? '...' : ''}"`
        }
      }

      return {
        success: true,
        message: `🙏 Seu pedido de oração foi registrado e será encaminhado para nossa equipe de intercessão. Estaremos orando por você!`
      }
    }

    case 'request_human_support': {
      // Marcar conversa para atendimento humano
      await supabase.from('whatsapp_conversations').upsert({
        church_id: context.churchId,
        phone_number: context.phoneNumber,
        contact_name: context.senderName,
        status: 'waiting_human',
        priority: args.priority || 'medium',
        reason: args.reason,
        updated_at: new Date().toISOString()
      }, { onConflict: 'church_id,phone_number' })

      // Buscar líder para notificar
      const { data: config } = await supabase
        .from('church_agent_config')
        .select('leaders_contacts')
        .eq('church_id', context.churchId)
        .single()

      const leader = config?.leaders_contacts?.[0]

      return {
        success: true,
        message: leader
          ? `Entendi! Vou encaminhar você para atendimento humano. ${leader.name} (${leader.role}) entrará em contato em breve pelo número ${leader.phone}. Motivo: ${args.reason}`
          : `Entendi! Sua solicitação foi registrada e um de nossos líderes entrará em contato em breve. Motivo: ${args.reason}`
      }
    }

    // Funções de consulta - delegar para o executor principal
    case 'get_church_location':
    case 'get_service_times':
    case 'get_leader_contacts':
    case 'get_next_events':
      return await executeFunctionCall(functionName, args, {
        pastorId: '',
        churchId: context.churchId,
        conversationId: context.phoneNumber
      })

    default:
      return { success: false, error: `Função desconhecida: ${functionName}` }
  }
}

/**
 * Call OpenAI API with function calling
 */
async function callOpenAI(
  systemPrompt: string,
  messages: ConversationMessage[],
  functions: any[]
): Promise<OpenAIMessage> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

  if (!openaiApiKey) {
    throw new Error('OpenAI API key is missing')
  }

  const requestMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10) // Últimas 10 mensagens para contexto
  ]

  const response = await fetch(`${openaiApiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: requestMessages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 800
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('[OpenAI] API error:', error)
    throw new Error('Failed to call OpenAI API')
  }

  const data = await response.json()
  return data.choices?.[0]?.message || { role: 'assistant', content: '' }
}

/**
 * Save message to database
 */
async function saveMessage(
  supabase: SupabaseClient,
  churchId: string,
  instanceName: string,
  direction: 'INBOUND' | 'OUTBOUND',
  fromNumber: string,
  toNumber: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from('whatsapp_messages').insert({
    church_id: churchId,
    instance_name: instanceName,
    direction,
    from_number: fromNumber,
    to_number: toNumber,
    message_type: 'text',
    content,
    status: direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
    sent_at: new Date().toISOString()
  })

  if (error) {
    console.error('[AI Agent] ❌ Error saving message:', error.message)
  }
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

/**
 * Process incoming message and generate AI response with function calling
 */
export async function processEvolutionMessage(
  input: ProcessMessageInput
): Promise<{ success: boolean; response?: string; error?: string }> {
  const { churchId, instanceName, phoneNumber, message, senderName, messageId } = input

  console.log(`[AI Agent] 📨 Processing message from ${phoneNumber}`)
  console.log(`[AI Agent] 💬 Message: "${message}"`)

  try {
    // Rate limiting
    const rateLimit = checkRateLimit(phoneNumber)
    if (!rateLimit.allowed) {
      console.log(`[AI Agent] ⚠️ Rate limit exceeded for ${phoneNumber}`)
      return {
        success: false,
        error: `Muitas mensagens. Aguarde ${rateLimit.retryAfter} segundos.`
      }
    }

    const supabase = getSupabaseClient()

    // Get agent configuration
    const { data: agentConfig, error: configError } = await supabase
      .from('church_agent_config')
      .select('*')
      .eq('church_id', churchId)
      .single()

    if (configError || !agentConfig) {
      console.log('[AI Agent] ❌ No agent config found')
      return { success: false, error: 'Agent not configured' }
    }

    // Check if agent is active
    if (agentConfig.is_active === false) {
      console.log('[AI Agent] ⏸️ Agent is disabled')
      return { success: false, error: 'Agent is disabled' }
    }

    // Check working hours
    if (!isWithinWorkingHours(agentConfig)) {
      console.log('[AI Agent] 🕐 Outside working hours')
      const outsideMessage = agentConfig.outside_hours_message || 
        'Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve!'
      
      await EvolutionService.sendTextWithTyping(instanceName, phoneNumber, outsideMessage)
      await saveMessage(supabase, churchId, instanceName, 'OUTBOUND', '', phoneNumber, outsideMessage)
      
      return { success: true, response: outsideMessage }
    }

    // Detect intent
    const intent = detectIntent(message)
    console.log(`[AI Agent] 🎯 Intent: ${intent.type} (confidence: ${intent.confidence})${intent.extractedName ? ` - Name: ${intent.extractedName}` : ''}`)

    // Check if first contact
    const firstContact = await isFirstContact(supabase, churchId, phoneNumber)
    console.log(`[AI Agent] 👋 First contact: ${firstContact}`)

    // Find user profile by phone number
    let userProfile = await findUserByPhone(supabase, churchId, phoneNumber)
    if (userProfile) {
      console.log(`[AI Agent] 👤 Recognized member: ${userProfile.full_name} (${userProfile.role})`)
    }

    // AUTO-CADASTRO: Se detectou um nome e o usuário não está cadastrado, cadastrar automaticamente
    if (intent.type === 'name_response' && intent.extractedName && !userProfile) {
      console.log(`[AI Agent] 📝 Auto-registering visitor: ${intent.extractedName}`)
      
      const registerResult = await executeVisitorFunction('register_visitor', { name: intent.extractedName }, {
        churchId,
        phoneNumber,
        senderName: intent.extractedName
      })
      
      if (registerResult.success) {
        console.log(`[AI Agent] ✅ Visitor auto-registered: ${intent.extractedName}`)
        // Atualizar userProfile após cadastro
        userProfile = await findUserByPhone(supabase, churchId, phoneNumber)
      } else {
        console.error(`[AI Agent] ❌ Failed to auto-register:`, registerResult.error)
      }
    }

    // Get conversation history
    const history = await getConversationHistory(supabase, churchId, phoneNumber)
    console.log(`[AI Agent] 📜 History: ${history.length} messages`)

    // Build system prompt with user profile
    const systemPrompt = buildSystemPrompt(agentConfig, {
      isFirstContact: firstContact,
      senderName: senderName || 'Visitante',
      userProfile
    })

    // Add current message to history
    const conversationMessages: ConversationMessage[] = [
      ...history,
      { role: 'user', content: message }
    ]

    // Get available functions for visitors
    const functions = getVisitorFunctions()

    // Function calling loop
    let response: string = ''
    let functionCallCount = 0

    while (functionCallCount < MAX_FUNCTION_CALLS) {
      const aiResponse = await callOpenAI(systemPrompt, conversationMessages, functions)

      // If AI wants to call a function
      if (aiResponse.function_call) {
        functionCallCount++
        const { name: functionName, arguments: functionArgs } = aiResponse.function_call

        console.log(`[AI Agent] 🔧 Function call ${functionCallCount}: ${functionName}`)
        console.log(`[AI Agent] 📋 Args: ${functionArgs}`)

        let parsedArgs: Record<string, any> = {}
        try {
          parsedArgs = JSON.parse(functionArgs)
        } catch (e) {
          console.error('[AI Agent] ❌ Failed to parse function args:', e)
        }

        // Execute function
        const result = await executeVisitorFunction(functionName, parsedArgs, {
          churchId,
          phoneNumber,
          senderName
        })

        console.log(`[AI Agent] ✅ Function result:`, result)

        // Add function result to conversation
        conversationMessages.push({
          role: 'assistant',
          content: `[Chamada de função: ${functionName}]\nResultado: ${result.message || JSON.stringify(result.data) || result.error}`
        })

        // If function has a direct message, use it
        if (result.message && !result.data) {
          response = result.message
          break
        }

        // Continue loop to let AI process the result
        continue
      }

      // AI returned a text response
      response = aiResponse.content || agentConfig.fallback_message || 'Desculpe, não consegui processar sua mensagem.'
      break
    }

    // Fallback if no response
    if (!response) {
      response = agentConfig.fallback_message || 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.'
    }

    console.log(`[AI Agent] 📤 Response: "${response.substring(0, 100)}..."`)

    // Send response via Evolution API
    await EvolutionService.sendTextWithTyping(instanceName, phoneNumber, response)

    // Save response to database
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('phone_number')
      .eq('instance_name', instanceName)
      .single()

    await saveMessage(
      supabase,
      churchId,
      instanceName,
      'OUTBOUND',
      instanceData?.phone_number || '',
      phoneNumber,
      response
    )

    console.log('[AI Agent] ✅ Message processed successfully')

    return { success: true, response }

  } catch (error: any) {
    console.error('[AI Agent] ❌ Error:', error)
    return { success: false, error: error.message }
  }
}
