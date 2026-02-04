import { Suspense } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    FileText,
    Plus,
    Mail,
    MessageSquare,
    Send,
    Lock,
    Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTemplates, type CommunicationChannel, type TemplateCategory } from '@/actions/super-admin/communications'

const channelConfig: Record<CommunicationChannel, { label: string; icon: typeof Mail }> = {
    email: { label: 'Email', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare },
    both: { label: 'Ambos', icon: Send },
    in_app: { label: 'In-App', icon: MessageSquare }
}

const categoryColors: Record<TemplateCategory, string> = {
    support: 'bg-blue-500/20 text-blue-400',
    billing: 'bg-emerald-500/20 text-emerald-400',
    notification: 'bg-purple-500/20 text-purple-400',
    marketing: 'bg-orange-500/20 text-orange-400',
    system: 'bg-zinc-500/20 text-zinc-400'
}

function TemplatesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 animate-pulse">
                    <div className="h-5 w-32 bg-zinc-800 rounded mb-2" />
                    <div className="h-4 w-full bg-zinc-800 rounded mb-4" />
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-zinc-800 rounded" />
                        <div className="h-6 w-20 bg-zinc-800 rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}

async function TemplatesList() {
    const templates = await getTemplates({ activeOnly: false })

    if (templates.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
                <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">Nenhum template</h3>
                <p className="text-zinc-500 mb-4">Crie templates para agilizar suas comunicacoes</p>
            </div>
        )
    }

    // Group by category
    const systemTemplates = templates.filter(t => t.is_system)
    const customTemplates = templates.filter(t => !t.is_system)

    return (
        <div className="space-y-8">
            {/* Custom Templates */}
            {customTemplates.length > 0 && (
                <div>
                    <h2 className="text-lg font-medium text-zinc-200 mb-4">Meus Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customTemplates.map((template) => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>
                </div>
            )}

            {/* System Templates */}
            {systemTemplates.length > 0 && (
                <div>
                    <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-zinc-500" />
                        Templates do Sistema
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemTemplates.map((template) => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function TemplateCard({ template }: { template: Awaited<ReturnType<typeof getTemplates>>[0] }) {
    const channelInfo = channelConfig[template.channel]
    const ChannelIcon = channelInfo.icon

    return (
        <div className={cn(
            'rounded-xl border bg-zinc-900 p-4 transition-colors',
            template.is_active ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
        )}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-100 truncate">{template.name}</h3>
                        {template.is_system && (
                            <Lock className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                        )}
                    </div>
                    {template.description && (
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{template.description}</p>
                    )}
                </div>
                {!template.is_system && (
                    <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                        <Pencil className="h-4 w-4 text-zinc-500" />
                    </button>
                )}
            </div>

            {/* Preview */}
            <div className="bg-zinc-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-zinc-400 line-clamp-3 font-mono">
                    {template.content.substring(0, 150)}...
                </p>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300">
                    <ChannelIcon className="h-3 w-3" />
                    {channelInfo.label}
                </span>
                {template.category && (
                    <span className={cn(
                        'px-2 py-1 rounded text-xs capitalize',
                        categoryColors[template.category as TemplateCategory] || 'bg-zinc-800 text-zinc-400'
                    )}>
                        {template.category}
                    </span>
                )}
                {!template.is_active && (
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                        Inativo
                    </span>
                )}
            </div>

            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                        Variaveis: {template.variables.map(v => `{{${v.name}}}`).join(', ')}
                    </p>
                </div>
            )}
        </div>
    )
}

export default function TemplatesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/support/communications"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-100">Templates de Comunicacao</h1>
                    <p className="text-zinc-400 mt-1">Gerencie templates para emails e mensagens</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-orange-500 hover:bg-orange-400 rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Novo Template
                </button>
            </div>

            {/* Templates List */}
            <Suspense fallback={<TemplatesSkeleton />}>
                <TemplatesList />
            </Suspense>
        </div>
    )
}
