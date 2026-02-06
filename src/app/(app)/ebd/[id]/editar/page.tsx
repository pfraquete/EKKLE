import { getEbdClassById } from '@/actions/ebd'
import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { EbdClassForm } from '@/components/ebd/ebd-class-form'

interface EditarClasseEbdPageProps {
    params: Promise<{ id: string }>
}

export default async function EditarClasseEbdPage({ params }: EditarClasseEbdPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('ebd'))) redirect('/dashboard')

    const data = await getEbdClassById(id)
    if (!data) redirect('/ebd')

    const members = await getChurchMembers()

    return (
        <EbdClassForm
            ebdClass={data.ebdClass}
            teachers={members}
        />
    )
}
