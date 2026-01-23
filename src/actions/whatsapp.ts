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

    const instanceName = `ekkle_church_${churchId.split('-')[0]}`

    // 2. Check if instance exists in Evolution API
    const existingInstance = await EvolutionService.getInstance(instanceName)

    if (existingInstance) {
        console.log('Instance already exists in Evolution API, deleting and recreating...')
        try {
            await EvolutionService.logoutInstance(instanceName)
            await EvolutionService.deleteInstance(instanceName)
            // Wait a bit before recreating
            await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (e) {
            console.warn('Error deleting existing instance:', e)
        }
    }

    // 3. Create instance in Evolution API
    try {
        await EvolutionService.createInstance(instanceName)
        console.log('Instance created successfully')
        // Wait for instance to be ready
        await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (e: any) {
        console.error('Error creating instance:', e)
        return { success: false, error: `Erro ao criar instância: ${e.message}` }
    }

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
    const maxRetries = 3
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
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 2000 * retries))
            } else {
                return {
                    success: false,
                    error: 'Não foi possível obter o QR Code. Por favor, tente novamente em alguns instantes.'
                }
            }
        }
    }

    // 6. Update DB with QR code
    if (qrCodeData) {
        await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCodeData, status: 'CONNECTING' })
            .eq('church_id', churchId)
    }

    revalidatePath('/configuracoes/whatsapp')
    return { success: true }
}

export async function disconnectWhatsApp(instanceName: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    try {
        await EvolutionService.logoutInstance(instanceName)
        await EvolutionService.deleteInstance(instanceName)
    } catch (e) {
        console.error('Error disconnecting from API:', e)
    }

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
    } catch (e) {
        console.error('Error checking status:', e)
        return 'ERROR'
    }
}
