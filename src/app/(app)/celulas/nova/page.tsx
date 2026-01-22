import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { NovaCelulaForm } from '@/components/forms/nova-celula-form'

export default async function NovaCelulaPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

    return (
        <NovaCelulaForm />
    )
}
