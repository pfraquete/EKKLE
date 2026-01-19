'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const reportSchema = z.object({
    meetingId: z.string().uuid(),
    churchId: z.string().uuid(),

    // Checklist
    hasIcebreaker: z.boolean(),
    hasWorship: z.boolean(),
    hasWord: z.boolean(),
    hasPrayer: z.boolean(),
    hasSnack: z.boolean(),

    // Attendance [{ profileId, present }]
    memberAttendance: z.array(z.object({
        profileId: z.string().uuid(),
        present: z.boolean()
    })),

    // Visitors [{ name, phone }]
    visitorsArray: z.array(z.object({
        name: z.string().min(2),
        phone: z.string().optional()
    })),

    // Metrics
    visitorsCount: z.number().min(0),
    decisionsCount: z.number().min(0),

    // Optional
    observations: z.string().optional()
})

export type ReportInput = z.infer<typeof reportSchema>

export async function submitReport(input: ReportInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Não autenticado')

    const {
        meetingId,
        churchId,
        hasIcebreaker,
        hasWorship,
        hasWord,
        hasPrayer,
        hasSnack,
        memberAttendance,
        visitorsArray,
        visitorsCount,
        decisionsCount,
        observations
    } = reportSchema.parse(input)

    // 1. Create the report
    const { data: report, error: reportError } = await supabase
        .from('cell_reports')
        .insert({
            meeting_id: meetingId,
            church_id: churchId,
            has_icebreaker: hasIcebreaker,
            has_worship: hasWorship,
            has_word: hasWord,
            has_prayer: hasPrayer,
            has_snack: hasSnack,
            visitors_count: visitorsCount,
            decisions_count: decisionsCount,
            observations: observations || null,
            submitted_by: user.id
        })
        .select()
        .single()

    if (reportError) throw new Error(reportError.message)

    const date = new Date().toISOString().split('T')[0]

    // 2. Register member attendance
    const memberAttendanceRecords = memberAttendance.map(m => ({
        church_id: churchId,
        context_type: 'CELL_MEETING' as const,
        context_id: meetingId,
        context_date: date,
        profile_id: m.profileId,
        status: m.present ? 'PRESENT' as const : 'ABSENT' as const,
        checked_in_by: user.id
    }))

    if (memberAttendanceRecords.length > 0) {
        const { error: attError } = await supabase
            .from('attendance')
            .insert(memberAttendanceRecords)
        if (attError) throw new Error(attError.message)
    }

    // 3. Register visitors
    const visitorRecords = visitorsArray.map(v => ({
        church_id: churchId,
        context_type: 'CELL_MEETING' as const,
        context_id: meetingId,
        context_date: date,
        visitor_name: v.name,
        visitor_phone: v.phone || null,
        status: 'PRESENT' as const,
        checked_in_by: user.id
    }))

    if (visitorRecords.length > 0) {
        const { error: vError } = await supabase
            .from('attendance')
            .insert(visitorRecords)
        if (vError) throw new Error(vError.message)
    }

    // 4. Close the meeting
    const { error: meetingError } = await supabase
        .from('cell_meetings')
        .update({
            status: 'COMPLETED',
            closed_at: new Date().toISOString()
        })
        .eq('id', meetingId)

    if (meetingError) throw new Error(meetingError.message)

    revalidatePath('/minha-celula')
    return { success: true, reportId: report.id }
}
