import { Suspense } from 'react'
import { getAllChurches } from '@/actions/super-admin/churches'
import { ChurchesTable } from '@/components/admin/churches'
import { Building2 } from 'lucide-react'

export const metadata = {
    title: 'Igrejas | Admin Ekkle',
    description: 'Gerenciamento de igrejas do Ekkle'
}

interface ChurchesPageProps {
    searchParams: Promise<{
        search?: string
        status?: string
        page?: string
    }>
}

async function ChurchesList({ searchParams }: { searchParams: ChurchesPageProps['searchParams'] }) {
    const params = await searchParams
    const result = await getAllChurches({
        search: params.search,
        status: params.status as 'active' | 'suspended' | 'all' | undefined,
        page: params.page ? parseInt(params.page) : 1
    })

    return (
        <ChurchesTable
            churches={result.churches}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
        />
    )
}

function ChurchesTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="w-40 h-10 bg-zinc-800 rounded-lg animate-pulse" />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            {[...Array(6)].map((_, i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {[...Array(10)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                                            <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </td>
                                {[...Array(5)].map((_, j) => (
                                    <td key={j} className="px-4 py-4">
                                        <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function ChurchesPage({ searchParams }: ChurchesPageProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-orange-500" />
                        Igrejas
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Gerencie todas as igrejas cadastradas no Ekkle
                    </p>
                </div>
            </div>

            {/* Table */}
            <Suspense fallback={<ChurchesTableSkeleton />}>
                <ChurchesList searchParams={searchParams} />
            </Suspense>
        </div>
    )
}
