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

    // 3. Create new instance (ignore 400 error if instance somehow still exists)
    try {
        await EvolutionService.createInstance(instanceName)
        console.log('Instance created successfully')
    } catch (e: any) {
        // Only ignore if the error specifically says "already exists"
        // 400 can be other things (invalid name, missing token, etc)
        const errorMessage = e.message?.toLowerCase() || '';
        if (errorMessage.includes('already exists') || errorMessage.includes('já existe')) {
            console.log('Instance already exists (from error message), continuing...')
        } else {
            console.error('Error creating instance:', e)
            throw e; // Re-throw real errors so we don't try to fetch QR for a non-existent instance
        }
    }

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
        const { data: updatedInstance } = await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCodeData, status: 'CONNECTING' })
            .eq('church_id', churchId)
            .select()
            .single()
        
        instance = updatedInstance || instance
    }

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
