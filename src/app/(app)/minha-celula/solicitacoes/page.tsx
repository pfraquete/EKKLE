import { getCellRequests } from '@/actions/join-cell'
import { getProfile } from '@/actions/auth'
import { RequestList } from '@/components/cells/request-list'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SolicitacoesPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const requests = await getCellRequests()

    return (
        <div className="max-w-md mx-auto space-y-6 pb-20 min-h-screen bg-zinc-950 p-4 rounded-[2.5rem]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/minha-celula">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-black text-white px-2">
                    Solicitações
                </h1>
            </div>

            <div className="space-y-2">
                <p className="text-zinc-400 text-sm px-2">
                    Aprove a entrada de novos membros na sua célula.
                </p>
            </div>

            <RequestList requests={requests} />
        </div>
    )
}
