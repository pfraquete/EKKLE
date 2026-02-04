import { Suspense } from 'react'
import { getAllUsers } from '@/actions/super-admin/users'
import { Users } from 'lucide-react'
import { UsersTable } from './users-table'

export const metadata = {
    title: 'Usuarios | Admin Ekkle',
    description: 'Busca global de usuarios do Ekkle'
}

interface UsersPageProps {
    searchParams: Promise<{
        search?: string
        role?: string
        churchId?: string
        page?: string
    }>
}

async function UsersList({ searchParams }: { searchParams: UsersPageProps['searchParams'] }) {
    const params = await searchParams
    const result = await getAllUsers({
        search: params.search,
        role: params.role,
        churchId: params.churchId,
        page: params.page ? parseInt(params.page) : 1
    })

    return (
        <UsersTable
            users={result.users}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
        />
    )
}

function UsersTableSkeleton() {
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
                            {[...Array(5)].map((_, i) => (
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
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                                            <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </td>
                                {[...Array(4)].map((_, j) => (
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

export default function UsersPage({ searchParams }: UsersPageProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                        <Users className="h-7 w-7 text-blue-500" />
                        Usuarios
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Busca global de usuarios em todas as igrejas
                    </p>
                </div>
            </div>

            {/* Table */}
            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersList searchParams={searchParams} />
            </Suspense>
        </div>
    )
}
