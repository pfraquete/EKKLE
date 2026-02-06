import { getMembers } from '@/actions/members'
import { getProfile } from '@/actions/auth'
import { getMemberCellData } from '@/actions/cell'
import { getPendingCellRequests } from '@/actions/cell-requests'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Users, Plus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { MembersList } from '@/components/members/members-list'
import { ExportMembersButton } from '@/components/members/export-members-button'
import { RequestList } from '@/components/cells/request-list'

export default async function MembrosPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    // Only leaders and pastors can access this page
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const [members, cellData, { data: pendingRequests }] = await Promise.all([
        getMembers(profile.cell_id),
        getMemberCellData(),
        getPendingCellRequests(),
    ])
    const cellName = cellData?.cell?.name || 'Minha Célula'

    // Add account status to each member
    const membersWithAccountStatus = members.map(member => ({
        ...member,
        has_account: !!(member.email && member.email.includes('@'))
    }))

    // Get non-real members (no account) for linking option
    const nonRealMembers = membersWithAccountStatus
        .filter(m => !m.has_account && m.is_active !== false)
        .map(m => ({
            id: m.id,
            full_name: m.full_name,
            phone: m.phone || null,
            member_stage: m.member_stage || 'VISITOR',
        }))

    // Transform pending requests for RequestList component
    const requestsForList = (pendingRequests || []).map(request => {
        const requestProfile = Array.isArray(request.profile) ? request.profile[0] : request.profile
        const requestCell = Array.isArray(request.cell) ? request.cell[0] : request.cell
        return {
            id: request.id,
            created_at: request.created_at,
            status: 'PENDING' as const,
            profile: {
                id: requestProfile?.id || '',
                full_name: requestProfile?.full_name || 'Sem nome',
                photo_url: requestProfile?.photo_url || null,
                phone: requestProfile?.phone || null,
            },
            cell: { name: requestCell?.name || cellName },
        }
    })

    return (
        <div className="space-y-6 pb-24 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/membro/minha-celula">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground">Membros</h1>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                {cellName}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ExportMembersButton members={members} cellName={cellName} />
                    <Link href="/membro/minha-celula/membros/novo">
                        <Button size="icon" className="rounded-full h-10 w-10 shadow-lg">
                            <Plus className="h-6 w-6" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Pending Requests */}
            {requestsForList.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                            Solicitações Pendentes
                        </h2>
                        <span className="bg-primary text-primary-foreground text-xs font-black px-2 py-0.5 rounded-full">
                            {requestsForList.length}
                        </span>
                    </div>
                    <RequestList requests={requestsForList} nonRealMembers={nonRealMembers} />
                </div>
            )}

            {/* Members List with Search, Filters, and Pagination */}
            <MembersList
                members={membersWithAccountStatus}
                itemsPerPage={10}
                basePath="/membro/minha-celula/membros"
            />
        </div>
    )
}
