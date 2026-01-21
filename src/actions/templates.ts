'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MessageTemplate {
    id: string
    church_id: string
    name: string
    content: string
    category: 'REMINDER' | 'BIRTHDAY' | 'WELCOME' | 'CUSTOM'
    is_active: boolean
}

export async function getTemplates(churchId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })

    return { data, error }
}

export async function upsertTemplate(template: Partial<MessageTemplate> & { church_id: string }) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('message_templates')
        .upsert(template)
        .select()
        .single()

    revalidatePath('/configuracoes/whatsapp/templates')
    return { data, error }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)

    revalidatePath('/configuracoes/whatsapp/templates')
    return { error }
}
