'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'

export async function startMeeting(cellId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id

    const supabase = await createClient()

    // Get the cell and verify it belongs to the church
    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .select('id, church_id')
        .eq('id', cellId)
        .eq('church_id', churchId)
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
    const profile = await getProfile()
    if (!profile) return null
    const churchId = profile.church_id

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
        .eq('church_id', churchId)
        .single()

    if (error) return null
    return meeting
}

export interface FullMeetingReportInput {
    cellId: string
    date: string
    hasIcebreaker: boolean
    hasWorship: boolean
    hasWord: boolean
    hasPrayer: boolean
    hasSnack: boolean
    memberAttendance: {
        profileId: string
        present: boolean
    }[]
    visitorsArray: {
        name: string
        phone?: string
    }[]
    visitorsCount: number
    decisionsCount: number
    observations?: string
}

export async function createFullMeetingReport(data: FullMeetingReportInput) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id

    const supabase = await createClient()

    // 1. Create meeting
    const { data: meeting, error: meetingError } = await supabase
        .from('cell_meetings')
        .insert({
            cell_id: data.cellId,
            church_id: churchId,
            date: data.date,
            status: 'COMPLETED',
            closed_at: new Date().toISOString()
        })
        .select()
        .single()

    if (meetingError) throw new Error(meetingError.message)

    // 2. Create report
    const { error: reportError } = await supabase
        .from('cell_reports')
        .insert({
            meeting_id: meeting.id,
            church_id: churchId,
            has_icebreaker: data.hasIcebreaker,
            has_worship: data.hasWorship,
            has_word: data.hasWord,
            has_prayer: data.hasPrayer,
            has_snack: data.hasSnack,
            visitors_count: data.visitorsCount,
            decisions_count: data.decisionsCount,
            observations: data.observations || null,
            submitted_by: profile.id
        })

    if (reportError) throw new Error(reportError.message)

    // 3. Register member attendance
    const memberRecords = data.memberAttendance.map((m) => ({
        church_id: churchId,
        context_type: 'CELL_MEETING',
        context_id: meeting.id,
        context_date: data.date,
        profile_id: m.profileId,
        status: m.present ? 'PRESENT' : 'ABSENT',
        checked_in_by: profile.id
    }))

    if (memberRecords.length > 0) {
        await supabase.from('attendance').insert(memberRecords)

        // Update last_attendance for present members
        const presentProfileIds = data.memberAttendance
            .filter(m => m.present)
            .map(m => m.profileId)

        if (presentProfileIds.length > 0) {
            await supabase
                .from('profiles')
                .update({ last_attendance: data.date })
                .in('id', presentProfileIds)
                .eq('church_id', churchId)
        }
    }

    // 4. Register visitors
    const visitorRecords = data.visitorsArray.map((v) => ({
        church_id: churchId,
        context_type: 'CELL_MEETING',
        context_id: meeting.id,
        context_date: data.date,
        visitor_name: v.name,
        visitor_phone: v.phone || null,
        status: 'PRESENT',
        checked_in_by: profile.id
    }))

    if (visitorRecords.length > 0) {
        await supabase.from('attendance').insert(visitorRecords)
    }

    revalidatePath('/minha-celula')
    revalidatePath('/minha-celula/reunioes')
    return { success: true, meetingId: meeting.id }
}
