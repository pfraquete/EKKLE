'use server'

import { createClient } from '@/lib/supabase/server'
import { EvolutionService } from '@/lib/evolution'
import { revalidatePath } from 'next/cache'

export async function getWhatsAppInstance(churchId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('church_id', churchId)
        .single()

    return { data, error }
}

export async function setupWhatsApp(churchId: string) {
    const supabase = await createClient()

    // 1. Check if instance already exists in DB
    let { data: instance } = await getWhatsAppInstance(churchId)

    if (!instance) {
        const instanceName = `ekkle_church_${churchId.split('-')[0]}`

        // 2. Create in Evolution API
        try {
            await EvolutionService.createInstance(instanceName)
        } catch (e) {
            console.warn('Instance might already exist in API:', e)
        }

        // 3. Save in DB
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
    }

    // 4. Get QR Code
    try {
        const { base64 } = await EvolutionService.getQrCode(instance!.instance_name)
        await supabase
            .from('whatsapp_instances')
            .update({ qr_code: base64, status: 'CONNECTING' })
            .eq('church_id', churchId)
    } catch (e) {
        console.error('Error fetching QR code:', e)
    }

    revalidatePath('/configuracoes/whatsapp')
    return { success: true }
}

export async function disconnectWhatsApp(churchId: string, instanceName: string) {
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

export async function checkWhatsAppStatus(churchId: string, instanceName: string) {
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
