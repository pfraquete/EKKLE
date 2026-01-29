import { getProfile } from '@/actions/auth'
import { getMemberCellData } from '@/actions/cell'
import { redirect } from 'next/navigation'
import { AttendanceForm } from '@/components/forms/attendance-form'

export default async function NovaReuniaoPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    // Only leaders can access this page
    if (profile.role !== 'LEADER') {
        redirect('/membro/minha-celula')
    }

    const data = await getMemberCellData()
    if (!data) redirect('/membro/minha-celula')

    return (
        <AttendanceForm
            members={data.members}
            cellId={profile.cell_id}
            redirectPath="/membro/minha-celula/reunioes"
        />
    )
}
