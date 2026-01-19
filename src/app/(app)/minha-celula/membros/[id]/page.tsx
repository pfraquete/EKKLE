import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MemberForm } from '@/components/forms/member-form'

export default async function EditarMembroPage({
    params,
}: {
    params: { id: string }
}) {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    const supabase = await createClient()
    const { data: member, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !member) notFound()

    // Ensure leadership check (if not pastor, must be from same cell)
    if (profile.role !== 'PASTOR' && member.cell_id !== profile.cell_id) {
        redirect('/minha-celula/membros')
    }

    return (
        <MemberForm
            initialData={member}
            cellId={profile.cell_id}
            churchId={profile.church_id}
        />
    )
}
