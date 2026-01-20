import { getCellDetails } from '@/actions/cell'
import { getPotentialLeaders } from '@/actions/cells'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { EditCellForm } from '@/components/forms/edit-cell-form'

interface EditCellPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditCellPage({ params }: EditCellPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

    const data = await getCellDetails(id, profile.church_id)
    if (!data) redirect('/celulas')

    const potentialLeaders = await getPotentialLeaders(profile.church_id)

    const cellForForm = {
        id: data.cell.id,
        name: data.cell.name,
        address: data.cell.address,
        neighborhood: data.cell.neighborhood,
        dayOfWeek: data.cell.dayOfWeek,
        meetingTime: data.cell.meetingTime,
        leaderId: data.cell.leader?.id || null
    }

    return (
        <EditCellForm
            cell={cellForForm}
            potentialLeaders={potentialLeaders}
        />
    )
}
