import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for webhook processing
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        }
        messageType?: string
        messageTimestamp?: number
        state?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload: EvolutionWebhookPayload = await request.json()
        
        console.log('[Evolution Webhook] Received event:', payload.event)
        console.log('[Evolution Webhook] Instance:', payload.instance)
        console.log('[Evolution Webhook] Data:', JSON.stringify(payload.data, null, 2))

        // Handle different event types
        switch (payload.event) {
            case 'CONNECTION_UPDATE':
                await handleConnectionUpdate(payload)
                break
            case 'MESSAGES_UPSERT':
                await handleMessageReceived(payload)
                break
            case 'QRCODE_UPDATED':
                await handleQrCodeUpdate(payload)
                break
            default:
                console.log('[Evolution Webhook] Unhandled event type:', payload.event)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Evolution Webhook] Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function handleConnectionUpdate(payload: EvolutionWebhookPayload) {
    const { instance, data } = payload
    const state = data.state

    console.log('[Evolution Webhook] Connection update for instance:', instance, 'State:', state)

    // Map Evolution state to our status
    let status: string
    switch (state) {
        case 'open':
            status = 'CONNECTED'
            break
        case 'close':
        case 'refused':
            status = 'DISCONNECTED'
            break
        case 'connecting':
            status = 'CONNECTING'
            break
        default:
            status = 'DISCONNECTED'
    }

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
        console.error('[Evolution Webhook] Error updating instance status:', error)
    } else {
        console.log('[Evolution Webhook] Instance status updated to:', status)
    }
}

async function handleMessageReceived(payload: EvolutionWebhookPayload) {
    const { instance, data } = payload

    if (!data.key) {
        console.log('[Evolution Webhook] No key in message data')
        return
    }

    const remoteJid = data.key.remoteJid
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
    const senderName = data.pushName || 'Desconhecido'
    const isFromMe = data.key.fromMe
    
    // Extract message text
    let messageText = ''
    if (data.message?.conversation) {
        messageText = data.message.conversation
    } else if (data.message?.extendedTextMessage?.text) {
        messageText = data.message.extendedTextMessage.text
    }

    console.log('[Evolution Webhook] Message received')
    console.log('[Evolution Webhook] From:', phone)
    console.log('[Evolution Webhook] Sender name:', senderName)
    console.log('[Evolution Webhook] Message:', messageText)
    console.log('[Evolution Webhook] Message type:', data.messageType)
    console.log('[Evolution Webhook] Is from me:', isFromMe)

    // Find the church associated with this instance
    const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('church_id, phone_number')
        .eq('instance_name', instance)
        .single()

    if (instanceError || !instanceData) {
        console.error('[Evolution Webhook] Could not find church for instance:', instance)
        return
    }

    const churchId = instanceData.church_id
    const instancePhone = instanceData.phone_number

    // Store the message in the database for chat history
    // Using the correct table structure
    const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
            church_id: churchId,
            instance_name: instance,
            direction: isFromMe ? 'outbound' : 'inbound',
            from_number: isFromMe ? instancePhone : phone,
            to_number: isFromMe ? phone : instancePhone,
            message_type: data.messageType || 'text',
            content: messageText,
            status: 'received',
            sent_at: data.messageTimestamp 
                ? new Date(data.messageTimestamp * 1000).toISOString() 
                : new Date().toISOString()
        })

    if (messageError) {
        console.error('[Evolution Webhook] Error storing message:', messageError.message)
    } else {
        console.log('[Evolution Webhook] Message stored successfully')
    }

    // If it's an incoming message, check if there's an AI agent configured
    if (!isFromMe && messageText) {
        const { data: agentConfig } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('church_id', churchId)
            .eq('is_active', true)
            .single()

        if (agentConfig) {
            console.log('[Evolution Webhook] AI Agent is active for this church')
            // AI agent processing would be triggered here
            // This could call an external AI service or process the message internally
        }
    }
}

async function handleQrCodeUpdate(payload: EvolutionWebhookPayload) {
    const { instance } = payload
    
    console.log('[Evolution Webhook] QR Code updated for instance:', instance)
    
    // The QR code is typically handled by the frontend polling
    // This webhook is mainly for logging purposes
}

// Also handle GET requests for webhook verification
export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'Evolution API Webhook endpoint is active',
        timestamp: new Date().toISOString()
    })
}
