import { getProfile } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { NovaCelulaForm } from '@/components/forms/nova-celula-form'

export default async function NovaCelulaPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('cells'))) redirect('/dashboard')

    return (
        <NovaCelulaForm />
    )
}
