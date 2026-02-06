import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MemberForm } from '@/components/forms/member-form'

export default async function EditarMembroPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const supabase = await createClient()
    const { data: member, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !member) notFound()

    // Non-pastors can only edit members from their own cell
    if (profile.role !== 'PASTOR' && member.cell_id !== profile.cell_id) {
        redirect('/membro/minha-celula/membros')
    }

    return (
        <MemberForm
            initialData={member}
            cellId={profile.cell_id}
            churchId={profile.church_id}
            currentUserRole={profile.role}
            redirectPath="/membro/minha-celula/membros"
        />
    )
}
