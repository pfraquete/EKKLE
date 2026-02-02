'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface KidsAttendance {
    id: string
    church_id: string
    meeting_id: string
    child_id: string | null
    volunteer_id: string | null
    visitor_name: string | null
    visitor_parent_phone: string | null
    attendance_type: 'CHILD' | 'VOLUNTEER' | 'VISITOR'
    status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED'
    notes: string | null
    created_at: string
    // Relations
    child?: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
    volunteer?: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
}

export interface AttendanceSummary {
    children: KidsAttendance[]
    volunteers: KidsAttendance[]
    visitors: KidsAttendance[]
    totalChildren: number
    totalVolunteers: number
    totalVisitors: number
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const markChildAttendanceSchema = z.object({
    meeting_id: z.string().uuid(),
    child_id: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'JUSTIFIED']).default('PRESENT'),
    notes: z.string().optional().nullable(),
})

const markVolunteerAttendanceSchema = z.object({
    meeting_id: z.string().uuid(),
    volunteer_id: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'JUSTIFIED']).default('PRESENT'),
    notes: z.string().optional().nullable(),
})

const addVisitorSchema = z.object({
    meeting_id: z.string().uuid(),
    visitor_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    visitor_parent_phone: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})

// =====================================================
// HELPER: Check Kids Network Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTORA_KIDS', 'PASTOR']) {
    const profile = await getProfile()
    if (!profile) {
        return { error: 'Nao autenticado', profile: null }
    }

    // Pastor sempre tem acesso
    if (profile.role === 'PASTOR') {
        return { error: null, profile }
    }

    // Verificar se tem papel na rede kids
    const supabase = await createClient()
    const { data: membership } = await supabase
        .from('kids_network_membership')
        .select('kids_role')
        .eq('profile_id', profile.id)
        .eq('church_id', profile.church_id)
        .single()

    if (!membership || !requiredRoles.includes(membership.kids_role)) {
        return { error: 'Sem permissao para esta acao', profile: null }
    }

    return { error: null, profile, kidsRole: membership.kids_role }
}

// =====================================================
// MARK CHILD ATTENDANCE
// =====================================================

export async function markChildAttendance(data: z.infer<typeof markChildAttendanceSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const validated = markChildAttendanceSchema.parse(data)
        const supabase = await createClient()

        // Check if attendance already exists
        const { data: existing } = await supabase
            .from('kids_meeting_attendance')
            .select('id')
            .eq('meeting_id', validated.meeting_id)
            .eq('child_id', validated.child_id)
            .maybeSingle()

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('kids_meeting_attendance')
                .update({
                    status: validated.status,
                    notes: validated.notes || null,
                })
                .eq('id', existing.id)

            if (error) {
                console.error('Error updating child attendance:', error)
                return { success: false, error: 'Erro ao atualizar presenca' }
            }
        } else {
            // Insert new
            const { error } = await supabase
                .from('kids_meeting_attendance')
                .insert({
                    church_id: profile.church_id,
                    meeting_id: validated.meeting_id,
                    child_id: validated.child_id,
                    attendance_type: 'CHILD',
                    status: validated.status,
                    notes: validated.notes || null,
                })

            if (error) {
                console.error('Error marking child attendance:', error)
                return { success: false, error: 'Erro ao registrar presenca' }
            }
        }

        revalidatePath(`/rede-kids/celulas`)

        return { success: true }
    } catch (error) {
        console.error('Error in markChildAttendance:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados invalidos' }
        }
        return { success: false, error: 'Erro ao registrar presenca' }
    }
}

// =====================================================
// MARK VOLUNTEER ATTENDANCE
// =====================================================

export async function markVolunteerAttendance(data: z.infer<typeof markVolunteerAttendanceSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const validated = markVolunteerAttendanceSchema.parse(data)
        const supabase = await createClient()

        // Check if attendance already exists
        const { data: existing } = await supabase
            .from('kids_meeting_attendance')
            .select('id')
            .eq('meeting_id', validated.meeting_id)
            .eq('volunteer_id', validated.volunteer_id)
            .maybeSingle()

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('kids_meeting_attendance')
                .update({
                    status: validated.status,
                    notes: validated.notes || null,
                })
                .eq('id', existing.id)

            if (error) {
                console.error('Error updating volunteer attendance:', error)
                return { success: false, error: 'Erro ao atualizar presenca' }
            }
        } else {
            // Insert new
            const { error } = await supabase
                .from('kids_meeting_attendance')
                .insert({
                    church_id: profile.church_id,
                    meeting_id: validated.meeting_id,
                    volunteer_id: validated.volunteer_id,
                    attendance_type: 'VOLUNTEER',
                    status: validated.status,
                    notes: validated.notes || null,
                })

            if (error) {
                console.error('Error marking volunteer attendance:', error)
                return { success: false, error: 'Erro ao registrar presenca' }
            }
        }

        revalidatePath(`/rede-kids/celulas`)

        return { success: true }
    } catch (error) {
        console.error('Error in markVolunteerAttendance:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados invalidos' }
        }
        return { success: false, error: 'Erro ao registrar presenca' }
    }
}

// =====================================================
// ADD VISITOR
// =====================================================

export async function addVisitor(data: z.infer<typeof addVisitorSchema>) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const validated = addVisitorSchema.parse(data)
        const supabase = await createClient()

        const { data: attendance, error } = await supabase
            .from('kids_meeting_attendance')
            .insert({
                church_id: profile.church_id,
                meeting_id: validated.meeting_id,
                visitor_name: validated.visitor_name,
                visitor_parent_phone: validated.visitor_parent_phone || null,
                attendance_type: 'VISITOR',
                status: 'PRESENT',
                notes: validated.notes || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding visitor:', error)
            return { success: false, error: 'Erro ao adicionar visitante' }
        }

        revalidatePath(`/rede-kids/celulas`)

        return { success: true, data: attendance }
    } catch (error) {
        console.error('Error in addVisitor:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0]?.message || 'Dados invalidos' }
        }
        return { success: false, error: 'Erro ao adicionar visitante' }
    }
}

// =====================================================
// REMOVE ATTENDANCE
// =====================================================

export async function removeAttendance(attendanceId: string) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('kids_meeting_attendance')
            .delete()
            .eq('id', attendanceId)
            .eq('church_id', profile.church_id)

        if (error) {
            console.error('Error removing attendance:', error)
            return { success: false, error: 'Erro ao remover presenca' }
        }

        revalidatePath(`/rede-kids/celulas`)

        return { success: true }
    } catch (error) {
        console.error('Error in removeAttendance:', error)
        return { success: false, error: 'Erro ao remover presenca' }
    }
}

// =====================================================
// BULK MARK ATTENDANCE
// =====================================================

export async function bulkMarkAttendance(
    meetingId: string,
    attendees: {
        childIds?: string[]
        volunteerIds?: string[]
    }
) {
    try {
        const { error: permError, profile } = await checkKidsPermission([
            'PASTORA_KIDS',
            'DISCIPULADORA_KIDS',
            'LEADER_KIDS',
            'PASTOR'
        ])

        if (permError || !profile) {
            return { success: false, error: permError || 'Sem permissao' }
        }

        const supabase = await createClient()

        // Remove all existing attendance for this meeting first
        await supabase
            .from('kids_meeting_attendance')
            .delete()
            .eq('meeting_id', meetingId)
            .eq('church_id', profile.church_id)
            .in('attendance_type', ['CHILD', 'VOLUNTEER'])

        const inserts: {
            church_id: string
            meeting_id: string
            child_id?: string
            volunteer_id?: string
            attendance_type: 'CHILD' | 'VOLUNTEER'
            status: 'PRESENT'
        }[] = []

        // Add children
        if (attendees.childIds) {
            for (const childId of attendees.childIds) {
                inserts.push({
                    church_id: profile.church_id,
                    meeting_id: meetingId,
                    child_id: childId,
                    attendance_type: 'CHILD',
                    status: 'PRESENT',
                })
            }
        }

        // Add volunteers
        if (attendees.volunteerIds) {
            for (const volunteerId of attendees.volunteerIds) {
                inserts.push({
                    church_id: profile.church_id,
                    meeting_id: meetingId,
                    volunteer_id: volunteerId,
                    attendance_type: 'VOLUNTEER',
                    status: 'PRESENT',
                })
            }
        }

        if (inserts.length > 0) {
            const { error } = await supabase
                .from('kids_meeting_attendance')
                .insert(inserts)

            if (error) {
                console.error('Error bulk marking attendance:', error)
                return { success: false, error: 'Erro ao registrar presencas' }
            }
        }

        revalidatePath(`/rede-kids/celulas`)

        return { success: true }
    } catch (error) {
        console.error('Error in bulkMarkAttendance:', error)
        return { success: false, error: 'Erro ao registrar presencas' }
    }
}

// =====================================================
// GET ATTENDANCE BY MEETING
// =====================================================

export async function getAttendanceByMeeting(meetingId: string): Promise<AttendanceSummary> {
    try {
        const profile = await getProfile()
        if (!profile) {
            return {
                children: [],
                volunteers: [],
                visitors: [],
                totalChildren: 0,
                totalVolunteers: 0,
                totalVisitors: 0,
            }
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_meeting_attendance')
            .select(`
                *,
                child:kids_children(id, full_name, photo_url),
                volunteer:profiles!kids_meeting_attendance_volunteer_id_fkey(id, full_name, photo_url)
            `)
            .eq('meeting_id', meetingId)
            .eq('church_id', profile.church_id)

        if (error) {
            console.error('Error fetching attendance:', error)
            return {
                children: [],
                volunteers: [],
                visitors: [],
                totalChildren: 0,
                totalVolunteers: 0,
                totalVisitors: 0,
            }
        }

        const children = data.filter(a => a.attendance_type === 'CHILD') as KidsAttendance[]
        const volunteers = data.filter(a => a.attendance_type === 'VOLUNTEER') as KidsAttendance[]
        const visitors = data.filter(a => a.attendance_type === 'VISITOR') as KidsAttendance[]

        return {
            children,
            volunteers,
            visitors,
            totalChildren: children.filter(c => c.status === 'PRESENT').length,
            totalVolunteers: volunteers.filter(v => v.status === 'PRESENT').length,
            totalVisitors: visitors.filter(v => v.status === 'PRESENT').length,
        }
    } catch (error) {
        console.error('Error in getAttendanceByMeeting:', error)
        return {
            children: [],
            volunteers: [],
            visitors: [],
            totalChildren: 0,
            totalVolunteers: 0,
            totalVisitors: 0,
        }
    }
}

// =====================================================
// GET ATTENDANCE HISTORY BY CHILD
// =====================================================

export async function getAttendanceByChild(childId: string): Promise<KidsAttendance[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kids_meeting_attendance')
            .select(`
                *,
                meeting:kids_cell_meetings(id, meeting_date, theme)
            `)
            .eq('child_id', childId)
            .eq('church_id', profile.church_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching child attendance:', error)
            return []
        }

        return data as KidsAttendance[]
    } catch (error) {
        console.error('Error in getAttendanceByChild:', error)
        return []
    }
}

// =====================================================
// GET ATTENDANCE REPORT
// =====================================================

export async function getAttendanceReport(cellId: string, startDate: string, endDate: string) {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        // Get all meetings in date range
        const { data: meetings } = await supabase
            .from('kids_cell_meetings')
            .select('id, meeting_date, kids_present, volunteers_present')
            .eq('kids_cell_id', cellId)
            .eq('church_id', profile.church_id)
            .gte('meeting_date', startDate)
            .lte('meeting_date', endDate)
            .eq('status', 'COMPLETED')
            .order('meeting_date', { ascending: true })

        if (!meetings || meetings.length === 0) {
            return {
                totalMeetings: 0,
                avgKidsPresent: 0,
                avgVolunteersPresent: 0,
                meetings: [],
            }
        }

        const totalKids = meetings.reduce((sum, m) => sum + (m.kids_present || 0), 0)
        const totalVolunteers = meetings.reduce((sum, m) => sum + (m.volunteers_present || 0), 0)

        return {
            totalMeetings: meetings.length,
            avgKidsPresent: Math.round(totalKids / meetings.length),
            avgVolunteersPresent: Math.round(totalVolunteers / meetings.length),
            meetings,
        }
    } catch (error) {
        console.error('Error in getAttendanceReport:', error)
        return null
    }
}

// =====================================================
// GET PRESENT IDS FOR MEETING
// =====================================================

export async function getPresentIdsForMeeting(meetingId: string): Promise<{
    childIds: string[]
    volunteerIds: string[]
}> {
    try {
        const profile = await getProfile()
        if (!profile) return { childIds: [], volunteerIds: [] }

        const supabase = await createClient()

        const { data } = await supabase
            .from('kids_meeting_attendance')
            .select('child_id, volunteer_id, attendance_type')
            .eq('meeting_id', meetingId)
            .eq('church_id', profile.church_id)
            .eq('status', 'PRESENT')

        if (!data) return { childIds: [], volunteerIds: [] }

        const childIds = data
            .filter(a => a.attendance_type === 'CHILD' && a.child_id)
            .map(a => a.child_id as string)

        const volunteerIds = data
            .filter(a => a.attendance_type === 'VOLUNTEER' && a.volunteer_id)
            .map(a => a.volunteer_id as string)

        return { childIds, volunteerIds }
    } catch (error) {
        console.error('Error in getPresentIdsForMeeting:', error)
        return { childIds: [], volunteerIds: [] }
    }
}
