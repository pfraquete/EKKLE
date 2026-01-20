import { getMeetingData } from '@/actions/meetings'
import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import { ReportForm } from '@/components/forms/report-form'

export default async function MeetingPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const meeting = await getMeetingData(id)

    if (!meeting) {
        notFound()
    }

    // Ensure user is authorized (Leader of this cell or Pastor)
    const isAuthorized = profile.role === 'PASTOR' || profile.cell_id === meeting.cell_id

    if (!isAuthorized) {
        redirect('/dashboard')
    }

    if (meeting.status === 'COMPLETED') {
        // Show summary instead of form (could be a future component)
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card rounded-3xl shadow-sm">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-4xl mb-6">✅</div>
                <h2 className="text-xl font-bold text-foreground mb-2">Relatório já Enviado</h2>
                <p className="text-muted-foreground mb-6">Esta reunião já foi finalizada. Consulte os detalhes no histórico.</p>
                <a href="/minha-celula" className="text-primary font-bold">Voltar para Minha Célula</a>
            </div>
        )
    }

    return (
        <ReportForm
            meeting={meeting}
            members={meeting.cell.members || []}
            churchId={profile.church_id}
        />
    )
}
