import { getMeetingData } from '@/actions/meetings'
import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import { ReportForm } from '@/components/forms/report-form'

export default async function MeetingPage({
    params,
}: {
    params: { id: string }
}) {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const meeting = await getMeetingData(params.id)

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl shadow-sm">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-6">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Relatório já Enviado</h2>
                <p className="text-gray-500 mb-6">Esta reunião já foi finalizada. Consulte os detalhes no histórico.</p>
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
