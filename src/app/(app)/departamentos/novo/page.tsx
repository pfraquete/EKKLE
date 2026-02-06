import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { DepartmentForm } from '@/components/departments/department-form'

export default async function NovoDepartamentoPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('departments'))) redirect('/dashboard')

    const members = await getChurchMembers()

    return <DepartmentForm members={members} />
}
