import { Suspense } from 'react'
import { getIntegrationStatuses } from '@/actions/super-admin/integrations'
import { getIntegrationConfig } from '@/lib/integration-config'
import { Puzzle, RefreshCw } from 'lucide-react'
import { IntegrationCards } from './integration-cards'

export const metadata = {
    title: 'Integracoes | Admin Ekkle',
    description: 'Monitoramento de integracoes do Ekkle'
}

async function IntegrationsContent() {
    const integrations = await getIntegrationStatuses()

    const integrationsWithConfig = integrations.map(int => ({
        ...int,
        config: getIntegrationConfig(int.provider)
    }))

    return <IntegrationCards integrations={integrationsWithConfig} />
}

function IntegrationsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                        <Puzzle className="h-7 w-7 text-orange-500" />
                        Integracoes
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Monitore o status de todas as integracoes externas
                    </p>
                </div>
            </div>

            {/* Status legend */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400">Operacional</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-zinc-400">Degradado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-zinc-400">Offline</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-500" />
                    <span className="text-zinc-400">Desconhecido</span>
                </div>
            </div>

            {/* Integration cards */}
            <Suspense fallback={<IntegrationsSkeleton />}>
                <IntegrationsContent />
            </Suspense>
        </div>
    )
}
