'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'

const serviceAttendanceSchema = z.object({
    churchId: z.string().uuid(),
    date: z.string().min(10),
    memberAttendance: z.array(z.object({
        profileId: z.string().uuid(),
        present: z.boolean()
    })),
    visitors: z.array(z.object({
        name: z.string().min(2),
        phone: z.string().optional()
    }))
})

const serviceAttendanceQuerySchema = z.object({
    churchId: z.string().uuid(),
    date: z.string().min(10)
})

export type ServiceAttendanceInput = z.infer<typeof serviceAttendanceSchema>

export interface ServiceAttendanceData {
    date: string
    members: {
        id: string
        full_name: string
        photo_url: string | null
        member_stage: string
    }[]
    attendanceByProfileId: Record<string, boolean>
    visitors: {
        name: string
        phone: string | null
    }[]
}

export async function createServiceAttendance(input: ServiceAttendanceInput) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const { date, memberAttendance, visitors } = serviceAttendanceSchema.parse(input)
    const churchId = profile.church_id

    const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('church_id', churchId)
        .eq('context_type', 'SERVICE')
        .eq('context_date', date)

    if (deleteError) throw new Error(deleteError.message)

    const attendanceRecords = memberAttendance.map((member) => ({
        church_id: churchId,
        context_type: 'SERVICE' as const,
        context_id: churchId,
        context_date: date,
        profile_id: member.profileId,
        status: member.present ? 'PRESENT' as const : 'ABSENT' as const,
        checked_in_by: profile.id
    }))

    const visitorRecords = visitors.map(visitor => ({
        church_id: churchId,
        context_type: 'SERVICE' as const,
        context_id: churchId,
        context_date: date,
        visitor_name: visitor.name,
        visitor_phone: visitor.phone || null,
        status: 'PRESENT' as const,
        checked_in_by: profile.id
    }))

    const records = [...attendanceRecords, ...visitorRecords]

    if (records.length > 0) {
        const { error: insertError } = await supabase
            .from('attendance')
            .insert(records)
        if (insertError) throw new Error(insertError.message)
    }

    revalidatePath('/presenca-cultos')
    return { success: true }
}

export async function getServiceAttendanceByDate(input: z.infer<typeof serviceAttendanceQuerySchema>): Promise<ServiceAttendanceData> {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()
    const { date } = serviceAttendanceQuerySchema.parse(input)
    const churchId = profile.church_id

    const [{ data: members, error: membersError }, { data: attendance, error: attendanceError }] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, photo_url, member_stage')
            .eq('church_id', churchId)
            .eq('is_active', true)
            .order('full_name'),
        supabase
            .from('attendance')
            .select('profile_id, status, visitor_name, visitor_phone')
            .eq('church_id', churchId)
            .eq('context_type', 'SERVICE')
            .eq('context_date', date)
    ])

    if (membersError) throw new Error(membersError.message)
    if (attendanceError) throw new Error(attendanceError.message)

    const attendanceByProfileId: Record<string, boolean> = {}
    const visitors: ServiceAttendanceData['visitors'] = []

        ; (attendance || []).forEach((entry: any) => {
            if (entry.profile_id) {
                attendanceByProfileId[entry.profile_id] = entry.status === 'PRESENT'
                return
            }

            if (entry.visitor_name) {
                visitors.push({
                    name: entry.visitor_name,
                    phone: entry.visitor_phone || null
                })
            }
        })

    return {
        date,
        members: members || [],
        attendanceByProfileId,
        visitors
    }
}
