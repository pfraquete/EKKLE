import { getMeetingData } from '@/actions/meetings'
import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import { MeetingSummaryClient } from './meeting-summary-client'

export default async function MeetingSummaryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // Only leaders and pastors can access this page
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const meeting = await getMeetingData(id)
    if (!meeting) notFound()

    return <MeetingSummaryClient meeting={meeting} meetingId={id} />
}
