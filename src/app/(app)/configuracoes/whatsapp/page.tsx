import { getWhatsAppInstance } from '@/actions/whatsapp'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { WhatsAppConfig } from '@/components/whatsapp/whatsapp-config'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function WhatsAppConfigPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: instance } = await getWhatsAppInstance()

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/configuracoes">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-foreground">Conexão WhatsApp</h1>
                    <p className="text-muted-foreground">
                        Conecte seu número para automações e disparos em massa.
                    </p>
                </div>
            </div>

            <WhatsAppConfig initialInstance={instance} />
        </div>
    )
}
