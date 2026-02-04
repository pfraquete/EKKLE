/**
 * Evolution API Webhook Handler - Enterprise Edition
 *
 * Processa eventos do WhatsApp via Evolution API com:
 * - Idempotência (evita duplicatas)
 * - Validação de origem
 * - Processamento assíncrono
 * - Logging detalhado
 *
 * @author Ekkle Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processEvolutionMessage } from '@/lib/ai-agent/evolution-message-processor'

// Initialize Supabase client with service role for webhook processing
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache para idempotência (em produção, usar Redis)
const processedMessages = new Map<string, number>()
const MESSAGE_CACHE_TTL = 60000 // 1 minuto

// Limpar cache periodicamente
setInterval(() => {
    const now = Date.now()
    for (const [key, timestamp] of processedMessages.entries()) {
        if (now - timestamp > MESSAGE_CACHE_TTL) {
            processedMessages.delete(key)
        }
    }
}, 30000)

interface EvolutionWebhookPayload {
    event: string
    instance: string
    data: {
        key?: {
            remoteJid: string
            fromMe: boolean
            id: string
        }
        pushName?: string
        message?: {
            conversation?: string
            extendedTextMessage?: {
                text: string
            }
            imageMessage?: any
            audioMessage?: any
            videoMessage?: any
            documentMessage?: any
        }
        messageType?: string
        messageTimestamp?: number
        state?: string
    }
    sender?: string
    apikey?: string
}

/**
 * Validate webhook origin (basic validation)
 */
function validateWebhook(request: NextRequest, payload: EvolutionWebhookPayload): boolean {
    // Check if it's from a valid Evolution API instance
    if (!payload.instance || !payload.event) {
        console.warn('[Webhook] Invalid payload: missing instance or event')
        return false
    }

    // In production, you could validate the API key header
    // const apiKey = request.headers.get('apikey')
    // if (apiKey !== process.env.EVOLUTION_API_KEY) return false

    return true
}

/**
 * Check if message was already processed (idempotency)
 */
function isMessageProcessed(messageId: string): boolean {
    if (processedMessages.has(messageId)) {
        console.log(`[Webhook] Message ${messageId} already processed, skipping`)
        return true
    }
    processedMessages.set(messageId, Date.now())
    return false
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const payload: EvolutionWebhookPayload = await request.json()

        // Validate webhook
        if (!validateWebhook(request, payload)) {
            return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
        }

        console.log(`[Webhook] 📥 Event: ${payload.event} | Instance: ${payload.instance}`)

        // Normalize event name (Evolution API sends both formats)
        const eventName = payload.event.toUpperCase().replace(/\./g, '_')
        console.log(`[Webhook] 📥 Normalized event: ${eventName}`)

        // Handle different event types
        switch (eventName) {
            case 'CONNECTION_UPDATE':
                await handleConnectionUpdate(payload)
                break

            case 'MESSAGES_UPSERT':
                await handleMessageReceived(payload)
                break

            case 'QRCODE_UPDATED':
                await handleQrCodeUpdate(payload)
                break

            case 'MESSAGES_UPDATE':
                // Status updates (delivered, read, etc.)
                await handleMessageStatusUpdate(payload)
                break

            default:
                console.log(`[Webhook] ⚠️ Unhandled event: ${payload.event}`)
        }

        const duration = Date.now() - startTime
        console.log(`[Webhook] ✅ Processed in ${duration}ms`)

        return NextResponse.json({ success: true, duration })

    } catch (error: any) {
        console.error('[Webhook] ❌ Error:', error.message)
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        )
    }
}

/**
 * Handle connection status updates
 */
async function handleConnectionUpdate(payload: EvolutionWebhookPayload) {
    const { instance, data } = payload
    const state = data.state

    console.log(`[Webhook] 🔌 Connection update: ${instance} -> ${state}`)

    // Map Evolution state to our status
    const statusMap: Record<string, string> = {
        'open': 'CONNECTED',
        'close': 'DISCONNECTED',
        'refused': 'DISCONNECTED',
        'connecting': 'CONNECTING'
    }

    const status = statusMap[state || ''] || 'DISCONNECTED'

    // Update the instance status in database
    const { error } = await supabase
        .from('whatsapp_instances')
        .update({
            status,
            last_ping: new Date().toISOString(),
            connected_at: status === 'CONNECTED' ? new Date().toISOString() : null
        })
        .eq('instance_name', instance)

    if (error) {
        console.error('[Webhook] ❌ Error updating instance status:', error.message)
    }
}

/**
 * Handle incoming messages
 */
async function handleMessageReceived(payload: EvolutionWebhookPayload) {
    const { instance, data } = payload

    if (!data.key) {
        console.log('[Webhook] ⚠️ No key in message data')
        return
    }

    const messageId = data.key.id
    const remoteJid = data.key.remoteJid
    const isFromMe = data.key.fromMe
    const senderName = data.pushName || 'Desconhecido'

    // Idempotency check
    if (isMessageProcessed(messageId)) {
        return
    }

    // Skip group messages
    if (remoteJid.includes('@g.us')) {
        console.log('[Webhook] 👥 Skipping group message')
        return
    }

    // Extract phone number
    const phone = remoteJid.replace('@s.whatsapp.net', '')

    // Extract message text
    let messageText = ''
    let messageType = 'text'

    if (data.message?.conversation) {
        messageText = data.message.conversation
    } else if (data.message?.extendedTextMessage?.text) {
        messageText = data.message.extendedTextMessage.text
    } else if (data.message?.imageMessage) {
        messageType = 'image'
        messageText = data.message.imageMessage.caption || '[Imagem]'
    } else if (data.message?.audioMessage) {
        messageType = 'audio'
        messageText = '[Áudio]'
    } else if (data.message?.videoMessage) {
        messageType = 'video'
        messageText = data.message.videoMessage.caption || '[Vídeo]'
    } else if (data.message?.documentMessage) {
        messageType = 'document'
        messageText = data.message.documentMessage.fileName || '[Documento]'
    }

    // Skip empty messages
    if (!messageText.trim()) {
        console.log('[Webhook] ⚠️ Skipping empty message')
        return
    }

    const direction = isFromMe ? 'outbound' : 'inbound'
    console.log(`[Webhook] 💬 ${direction === 'inbound' ? '📥' : '📤'} ${phone}: "${messageText.substring(0, 50)}..."`)

    // Find the church associated with this instance
    const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('church_id, phone_number')
        .eq('instance_name', instance)
        .single()

    if (instanceError || !instanceData) {
        console.error('[Webhook] ❌ Could not find church for instance:', instance)
        return
    }

    const churchId = instanceData.church_id
    const instancePhone = instanceData.phone_number || ''

    // Store the message in the database
    // Note: We use in-memory idempotency check instead of database-level
    const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
            church_id: churchId,
            instance_name: instance,
            direction,
            from_number: isFromMe ? instancePhone : phone,
            to_number: isFromMe ? phone : instancePhone,
            message_type: messageType,
            content: messageText,
            status: 'received',
            sent_at: data.messageTimestamp
                ? new Date(data.messageTimestamp * 1000).toISOString()
                : new Date().toISOString()
        })

    if (messageError && !messageError.message.includes('duplicate')) {
        console.error('[Webhook] ❌ Error storing message:', messageError.message)
    }

    // Update conversation tracking
    await supabase
        .from('whatsapp_conversations')
        .upsert({
            church_id: churchId,
            phone_number: phone,
            contact_name: senderName,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'church_id,phone_number' })

    // If it's an incoming text message, process with AI agent
    if (!isFromMe && messageText && messageType === 'text') {
        // Check if there's an AI agent configured for this church
        const { data: agentConfig } = await supabase
            .from('church_agent_config')
            .select('id, is_active')
            .eq('church_id', churchId)
            .single()

        if (agentConfig && agentConfig.is_active !== false) {
            console.log('[Webhook] 🤖 Processing with AI Agent...')

            // Process message with AI agent (async, don't block webhook response)
            processEvolutionMessage({
                churchId,
                instanceName: instance,
                phoneNumber: phone,
                message: messageText,
                senderName,
                messageId
            }).then(result => {
                if (result.success) {
                    console.log('[Webhook] ✅ AI Agent responded successfully')
                } else {
                    console.error('[Webhook] ❌ AI Agent error:', result.error)
                }
            }).catch(error => {
                console.error('[Webhook] ❌ AI Agent processing error:', error.message)
            })
        } else {
            console.log('[Webhook] ⏸️ AI Agent not configured or disabled')
        }
    }
}

/**
 * Handle message status updates (delivered, read, etc.)
 */
async function handleMessageStatusUpdate(payload: EvolutionWebhookPayload) {
    // This could be used to update message delivery status
    // For now, just log it
    console.log('[Webhook] 📊 Message status update received')
}

/**
 * Handle QR code updates
 */
async function handleQrCodeUpdate(payload: EvolutionWebhookPayload) {
    const { instance } = payload
    console.log(`[Webhook] 📱 QR Code updated for: ${instance}`)

    // Update instance status to CONNECTING
    await supabase
        .from('whatsapp_instances')
        .update({
            status: 'CONNECTING',
            last_ping: new Date().toISOString()
        })
        .eq('instance_name', instance)
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'Evolution API Webhook endpoint is active',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    })
}
