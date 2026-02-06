import { getMembers } from '@/actions/members'
import { getProfile } from '@/actions/auth'
import { getMemberCellData } from '@/actions/cell'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Users, Plus } from 'lucide-react'
import Link from 'next/link'
import { MembersList } from '@/components/members/members-list'
import { ExportMembersButton } from '@/components/members/export-members-button'

export default async function MembrosPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    // Only leaders and pastors can access this page
    if (profile.role !== 'LEADER' && profile.role !== 'PASTOR') {
        redirect('/membro/minha-celula')
    }

    const members = await getMembers(profile.cell_id)
    const cellData = await getMemberCellData()
    const cellName = cellData?.cell?.name || 'Minha Célula'

    // Add account status to each member
    const membersWithAccountStatus = members.map(member => ({
        ...member,
        has_account: !!(member.email && member.email.includes('@'))
    }))

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

            {/* Members List with Search, Filters, and Pagination */}
            <MembersList
                members={membersWithAccountStatus}
                itemsPerPage={10}
                basePath="/membro/minha-celula/membros"
            />
        </div>
    )
}
