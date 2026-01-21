import { getProfile } from '@/actions/auth'
import { getServiceAttendanceByDate } from '@/actions/service-attendance'
import { ServiceAttendanceView } from '@/components/cultos/service-attendance-view'
import { redirect } from 'next/navigation'

export default async function CultosPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const today = new Date().toISOString().split('T')[0]
    const initialData = await getServiceAttendanceByDate({
        churchId: profile.church_id,
        date: today
    })

    return (
        <ServiceAttendanceView
            churchId={profile.church_id}
            initialDate={today}
            initialData={initialData}
        />
    )
}
