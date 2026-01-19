'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPotentialLeaders(churchId: string) {
    const supabase = await createClient()

    // Find users that are not already leading a cell or are marked as potential leaders
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('full_name')

    return data || []
}

export async function createCell(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const leaderId = formData.get('leaderId') as string
    const churchId = formData.get('churchId') as string

    const { data: cell, error } = await supabase
        .from('cells')
        .insert({
            name,
            leader_id: leaderId || null,
            church_id: churchId,
            status: 'ACTIVE'
        })
        .select()
        .single()

    if (error) throw error

    // If a leader was assigned, update their profile role to LEADER and link the cell
    if (leaderId) {
        await supabase
            .from('profiles')
            .update({
                role: 'LEADER',
                cell_id: cell.id
            })
            .eq('id', leaderId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/configuracoes')
    return cell
}
