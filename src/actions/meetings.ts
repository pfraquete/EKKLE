'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startMeeting(cellId: string) {
    const supabase = await createClient()

    // Get church_id from the cell
    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .select('church_id')
        .eq('id', cellId)
        .single()

    if (cellError || !cell) {
        throw new Error('Célula não encontrada')
    }

    // Create meeting
    const { data: meeting, error } = await supabase
        .from('cell_meetings')
        .insert({
            cell_id: cellId,
            church_id: cell.church_id,
            date: new Date().toISOString().split('T')[0],
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/minha-celula')
    return meeting
}

export async function getMeetingData(meetingId: string) {
    const supabase = await createClient()

    const { data: meeting, error } = await supabase
        .from('cell_meetings')
        .select(`
      *,
      cell:cells(
        id,
        name,
        members:profiles(
          id,
          full_name,
          photo_url
        )
      ),
      report:cell_reports(*),
      attendance(*)
    `)
        .eq('id', meetingId)
        .single()

    if (error) return null
    return meeting
}
