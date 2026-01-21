export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { getWhatsAppInstance } from '@/actions/whatsapp'
import { redirect } from 'next/navigation'
import { WhatsAppConfig } from '@/components/whatsapp/whatsapp-config'

export default async function WhatsAppSettingsPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: instance } = await getWhatsAppInstance(profile.church_id)

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-foreground">Configurações de WhatsApp</h1>
                <p className="text-muted-foreground">
                    Conecte o número de WhatsApp da sua igreja para automatizar lembretes e avisos.
                </p>
            </div>

            <WhatsAppConfig churchId={profile.church_id} initialInstance={instance} />
        </div>
    )
}
