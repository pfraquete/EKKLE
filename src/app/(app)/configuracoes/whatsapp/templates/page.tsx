export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { getTemplates } from '@/actions/templates'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '@/components/whatsapp/template-editor'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function WhatsAppTemplatesPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const { data: templates } = await getTemplates()

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/configuracoes/whatsapp">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-foreground">Mensagens Automáticas</h1>
                    <p className="text-muted-foreground">
                        Configure o texto das mensagens que o Ekkle envia pelo seu WhatsApp.
                    </p>
                </div>
            </div>

            <TemplateEditor initialTemplates={templates || []} />
        </div>
    )
}
