import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { MemberForm } from '@/components/forms/member-form'

export default async function NovoMembroPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    return (
        <MemberForm
            cellId={profile.cell_id}
            churchId={profile.church_id}
            currentUserRole={profile.role}
        />
    )
}
