'use server'

import { createClient } from '@/lib/supabase/server'
import { EvolutionService } from '@/lib/evolution'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'

export async function getWhatsAppInstance() {
    const profile = await getProfile()
    if (!profile) return { data: null, error: new Error('Não autenticado') }
    const churchId = profile.church_id
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('church_id', churchId)
        .single()

    return { data, error }
}

export async function setupWhatsApp() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    // 1. Check if instance already exists in DB
    let { data: instance } = await getWhatsAppInstance()

    let instanceName = `ekkle_church_${churchId.split('-')[0]}`

    // 2. Force cleanup - delete instance regardless of state (ignore errors)
    console.log('Force cleanup: attempting to delete any existing instance...')
    try {
        await EvolutionService.logoutInstance(instanceName)
    } catch (e) {
        console.log('Logout failed (expected if instance does not exist):', (e as Error).message)
    }

    try {
        await EvolutionService.deleteInstance(instanceName)
        console.log('Instance deleted successfully')
    } catch (e) {
        console.log('Delete failed (expected if instance does not exist):', (e as Error).message)
    }

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 3. Create new instance (with retry if name is in use)
    let createSuccess = false
    let attempt = 0
    let finalInstanceName = instanceName
    
    while (!createSuccess && attempt < 3) {
        try {
            finalInstanceName = attempt === 0 ? instanceName : `${instanceName}_${attempt}`
            await EvolutionService.createInstance(finalInstanceName)
            console.log(`Instance created successfully: ${finalInstanceName}`)
            createSuccess = true
        } catch (e: any) {
            const errorMessage = e.message?.toLowerCase() || ''
            
            // Check if error is "name already in use" (403 Forbidden)
            if (errorMessage.includes('already in use') || errorMessage.includes('forbidden')) {
                console.log(`Instance name ${finalInstanceName} is already in use, trying with suffix...`)
                attempt++
                if (attempt >= 3) {
                    throw new Error('Failed to create instance after 3 attempts. Please contact support to clean up orphaned instances.')
                }
            } else if (errorMessage.includes('already exists') || errorMessage.includes('já existe')) {
                console.log('Instance already exists (from error message), continuing...')
                createSuccess = true
            } else {
                console.error('Error creating instance:', e)
                throw e
            }
        }
    }
    
    // Update instanceName to the one that worked
    instanceName = finalInstanceName

    // Wait for instance to be ready
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 4. Save or update in DB
    if (!instance) {
        const { data: newInstance, error: dbError } = await supabase
            .from('whatsapp_instances')
            .insert({
                church_id: churchId,
                instance_name: instanceName,
                status: 'CONNECTING'
            })
            .select()
            .single()

        if (dbError) throw dbError
        instance = newInstance
    } else {
        // Update existing instance
        await supabase
            .from('whatsapp_instances')
            .update({ status: 'CONNECTING', qr_code: null })
            .eq('church_id', churchId)
    }

    // 5. Get QR Code with retry logic
    let retries = 0
    const maxRetries = 5
    let qrCodeData: string | null = null

    while (retries < maxRetries && !qrCodeData) {
        try {
            console.log(`Attempting to get QR code (attempt ${retries + 1}/${maxRetries})...`)
            const { base64 } = await EvolutionService.getQrCode(instanceName)

            // Ensure base64 has the data:image prefix if missing
            qrCodeData = base64.startsWith('data:image')
                ? base64
                : `data:image/png;base64,${base64}`

            console.log('QR code retrieved successfully')
        } catch (e: any) {
            retries++
            console.error(`Error fetching QR code (attempt ${retries}/${maxRetries}):`, e.message)

            if (retries < maxRetries) {
                // Wait before retrying (exponential backoff: 3s, 6s, 9s, 12s, 15s)
                const waitTime = 3000 * retries
                console.log(`Waiting ${waitTime}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
            } else {
                return {
                    success: false,
                    error: 'Não foi possível obter o QR Code após 5 tentativas. Verifique se a Evolution API está funcionando corretamente.'
                }
            }
        }
    }

    // 6. Update DB with QR code
    if (qrCodeData) {
        console.log('[setupWhatsApp] Atualizando banco com QR code...')
        const { data: updatedInstance, error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCodeData, status: 'CONNECTING' })
            .eq('church_id', churchId)
            .select()
            .single()
        
        if (updateError) {
            console.error('[setupWhatsApp] Erro ao atualizar banco:', updateError)
        } else {
            console.log('[setupWhatsApp] Banco atualizado com sucesso')
            instance = updatedInstance || instance
        }
    }

    console.log('[setupWhatsApp] Retornando instância:', {
        instance_name: instance.instance_name,
        status: instance.status,
        has_qr_code: !!instance.qr_code,
        qr_code_length: instance.qr_code?.length || 0
    })

    revalidatePath('/configuracoes/whatsapp')
    return { 
        success: true,
        instance: {
            instance_name: instance.instance_name,
            status: instance.status,
            qr_code: instance.qr_code,
            last_ping: instance.last_ping
        }
    }
}

export async function disconnectWhatsApp(instanceName: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    // Try to logout and delete, but don't fail if instance doesn't exist (404)
    try {
        await EvolutionService.logoutInstance(instanceName)
        console.log('Instance logged out successfully')
    } catch (e: any) {
        if (e.message?.includes('404')) {
            console.log('Instance not found during logout (404), continuing...')
        } else {
            console.error('Error during logout:', e)
        }
    }

    try {
        await EvolutionService.deleteInstance(instanceName)
        console.log('Instance deleted successfully')
    } catch (e: any) {
        if (e.message?.includes('404')) {
            console.log('Instance not found during delete (404), continuing...')
        } else {
            console.error('Error during delete:', e)
        }
    }

    // Delete from database
    const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('church_id', churchId)

    if (error) throw error

    revalidatePath('/configuracoes/whatsapp')
    return { success: true }
}

export async function checkWhatsAppStatus(instanceName: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    try {
        const state = await EvolutionService.getConnectionState(instanceName)
        const status = state === 'open' ? 'CONNECTED' : 'DISCONNECTED'

        await supabase
            .from('whatsapp_instances')
            .update({ status, last_ping: new Date().toISOString() })
            .eq('church_id', churchId)

        return status
    } catch (e: any) {
        // 404 means instance doesn't exist or isn't connected yet
        if (e.message?.includes('404')) {
            console.log('Instance not found (404), marking as DISCONNECTED')
            await supabase
                .from('whatsapp_instances')
                .update({ status: 'DISCONNECTED' })
                .eq('church_id', churchId)
            return 'DISCONNECTED'
        }

        console.error('Error checking status:', e)
        return 'ERROR'
    }
}


export async function getWhatsAppChats() {
    const profile = await getProfile()
    if (!profile) return { data: [], error: new Error('Não autenticado') }
    
    const { data: instance } = await getWhatsAppInstance()
    if (!instance || instance.status !== 'CONNECTED') {
        return { data: [], error: new Error('WhatsApp não conectado') }
    }

    try {
        const chats = await EvolutionService.getChats(instance.instance_name)
        
        // Transform chats to our format, filtering out groups
        const contacts = chats
            .filter((chat: any) => chat.remoteJid?.endsWith('@s.whatsapp.net'))
            .map((chat: any) => {
                const phone = chat.remoteJid?.replace('@s.whatsapp.net', '') || ''
                return {
                    id: chat.id || chat.remoteJid,
                    remoteJid: chat.remoteJid,
                    name: chat.pushName || chat.name || formatPhoneNumber(phone),
                    phone: phone,
                    photo_url: chat.profilePicUrl || null,
                    last_message: chat.lastMessage?.content || '',
                    last_message_time: chat.lastMessage?.timestamp 
                        ? new Date(chat.lastMessage.timestamp * 1000).toISOString()
                        : undefined,
                    unread_count: chat.unreadCount || 0,
                    is_online: false
                }
            })
            .sort((a: any, b: any) => {
                const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
                const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
                return timeB - timeA
            })

        return { data: contacts, error: null }
    } catch (error: any) {
        console.error('Error fetching WhatsApp chats:', error)
        return { data: [], error }
    }
}

export async function getWhatsAppMessages(remoteJid: string) {
    const profile = await getProfile()
    if (!profile) return { data: [], error: new Error('Não autenticado') }
    
    const { data: instance } = await getWhatsAppInstance()
    if (!instance || instance.status !== 'CONNECTED') {
        return { data: [], error: new Error('WhatsApp não conectado') }
    }

    try {
        const response = await EvolutionService.getMessages(instance.instance_name, remoteJid, 100)
        const records = response?.messages?.records || []
        
        // Transform messages to our format
        const messages = records
            .filter((msg: any) => {
                const msgType = msg.messageType
                return msgType === 'conversation' || msgType === 'extendedTextMessage'
            })
            .map((msg: any) => {
                let content = ''
                if (msg.message?.conversation) {
                    content = msg.message.conversation
                } else if (msg.message?.extendedTextMessage?.text) {
                    content = msg.message.extendedTextMessage.text
                }

                return {
                    id: msg.key?.id || msg.id,
                    contact_id: remoteJid,
                    content: content,
                    is_from_me: msg.key?.fromMe || false,
                    timestamp: msg.messageTimestamp 
                        ? new Date(msg.messageTimestamp * 1000).toISOString()
                        : new Date().toISOString(),
                    status: 'read' as const,
                    type: 'text' as const
                }
            })
            .sort((a: any, b: any) => {
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            })

        return { data: messages, error: null }
    } catch (error: any) {
        console.error('Error fetching WhatsApp messages:', error)
        return { data: [], error }
    }
}

export async function sendWhatsAppMessage(remoteJid: string, text: string) {
    const profile = await getProfile()
    if (!profile) return { success: false, error: 'Não autenticado' }
    
    const { data: instance } = await getWhatsAppInstance()
    if (!instance || instance.status !== 'CONNECTED') {
        return { success: false, error: 'WhatsApp não conectado' }
    }

    try {
        const phone = remoteJid.replace('@s.whatsapp.net', '')
        await EvolutionService.sendText(instance.instance_name, phone, text)
        return { success: true, error: null }
    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error)
        return { success: false, error: error.message }
    }
}

function formatPhoneNumber(phone: string): string {
    if (!phone) return 'Desconhecido'
    // Format Brazilian phone numbers
    if (phone.startsWith('55') && phone.length >= 12) {
        const ddd = phone.slice(2, 4)
        const number = phone.slice(4)
        if (number.length === 9) {
            return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
        } else if (number.length === 8) {
            return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
        }
    }
    return `+${phone}`
}
