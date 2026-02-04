import { getProfile } from '@/actions/auth'
import { getWhatsAppInstance, getWhatsAppChats } from '@/actions/whatsapp'
import { getAgentConfig } from '@/actions/agent-config'
import { redirect } from 'next/navigation'
import { ComunicacoesClient } from '@/components/whatsapp/comunicacoes-client'
import { WhatsAppContact } from '@/components/whatsapp-chat'
import { createClient } from '@/lib/supabase/server'

export default async function ComunicacoesPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: instance } = await getWhatsAppInstance()
    const agentConfig = await getAgentConfig()

    // Get church name
    const supabase = await createClient()
    const { data: church } = await supabase
        .from('churches')
        .select('name')
        .eq('id', profile.church_id)
        .single()

    // Fetch real contacts from Evolution API
    let contacts: WhatsAppContact[] = []
    if (instance?.status === 'CONNECTED') {
        const { data: chats } = await getWhatsAppChats()
        contacts = chats || []
    }

    return (
        <ComunicacoesClient
            instance={instance}
            agentConfig={agentConfig}
            contacts={contacts}
            churchId={profile.church_id}
            churchName={church?.name}
        />
    )
}
