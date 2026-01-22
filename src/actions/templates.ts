'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'

export interface MessageTemplate {
    id: string
    church_id: string
    name: string
    content: string
    category: 'REMINDER' | 'BIRTHDAY' | 'WELCOME' | 'CUSTOM'
    is_active: boolean
}

export async function getTemplates() {
    const profile = await getProfile()
    if (!profile) return { data: null, error: new Error('Não autenticado') }
    const churchId = profile.church_id
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })

    return { data, error }
}

export async function upsertTemplate(template: Partial<MessageTemplate>) {
    const profile = await getProfile()
    if (!profile) return { data: null, error: new Error('Não autenticado') }
    const churchId = profile.church_id

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('message_templates')
        .upsert({ ...template, church_id: churchId })
        .select()
        .single()

    revalidatePath('/configuracoes/whatsapp/templates')
    return { data, error }
}

export async function deleteTemplate(id: string) {
    const profile = await getProfile()
    if (!profile) return { error: new Error('Não autenticado') }

    const supabase = await createClient()
    const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('church_id', profile.church_id)

    revalidatePath('/configuracoes/whatsapp/templates')
    return { error }
}
