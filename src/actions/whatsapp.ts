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

        // Ensure base64 has the data:image prefix if missing
        const qrCodeData = base64.startsWith('data:image')
            ? base64
            : `data:image/png;base64,${base64}`

        await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCodeData, status: 'CONNECTING' })
            .eq('church_id', churchId)
    } catch (e: any) {
        console.error('Error fetching QR code:', e)
        return { success: false, error: e.message || 'Erro ao obter o QR Code da Evolution API' }
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
