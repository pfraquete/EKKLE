import { getProfile } from '@/actions/auth'
import { getMeetingData } from '@/actions/meetings'
import { getMemberCellData } from '@/actions/cell'
import { redirect, notFound } from 'next/navigation'
import { EditMeetingForm } from '@/components/forms/edit-meeting-form'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function EditarReuniaoPage({ params }: PageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    // Only leaders and pastors can edit
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const [meeting, cellData] = await Promise.all([
        getMeetingData(id),
        getMemberCellData()
    ])

    if (!meeting) notFound()
    if (!cellData) redirect('/membro/minha-celula')

    const report = meeting.report?.[0] || null

    const meetingData = {
        id: meeting.id,
        date: meeting.date,
        report,
        attendance: meeting.attendance.map((a: { id: string; profile_id?: string; visitor_name?: string; visitor_phone?: string; status: string }) => ({
            id: a.id,
            profile_id: a.profile_id || null,
            visitor_name: a.visitor_name || null,
            visitor_phone: a.visitor_phone || null,
            status: a.status
        }))
    }

    return (
        <EditMeetingForm
            members={cellData.members}
            meeting={meetingData}
            redirectPath="/membro/minha-celula/reunioes"
        />
    )
}
