import { getProfile } from '@/actions/auth'
import { getMyCellData } from '@/actions/cell'
import { redirect } from 'next/navigation'
import { AttendanceForm } from '@/components/forms/attendance-form'

export default async function NovaReuniaoPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    const data = await getMyCellData(profile.id)
    if (!data) redirect('/minha-celula')

    return (
        <AttendanceForm
            members={data.members}
            cellId={profile.cell_id}
            churchId={profile.church_id}
        />
    )
}
