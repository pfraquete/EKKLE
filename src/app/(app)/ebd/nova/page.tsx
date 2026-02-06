import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { EbdClassForm } from '@/components/ebd/ebd-class-form'

export default async function NovaClasseEbdPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('ebd'))) redirect('/dashboard')

    const members = await getChurchMembers()

    return <EbdClassForm teachers={members} />
}
