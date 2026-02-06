import { getDepartmentById } from '@/actions/departments'
import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { DepartmentForm } from '@/components/departments/department-form'

interface EditarDepartamentoPageProps {
    params: Promise<{ id: string }>
}

export default async function EditarDepartamentoPage({ params }: EditarDepartamentoPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('departments'))) redirect('/dashboard')

    const data = await getDepartmentById(id)
    if (!data) redirect('/departamentos')

    const members = await getChurchMembers()

    return (
        <DepartmentForm
            department={data.department}
            members={members}
        />
    )
}
