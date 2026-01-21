import { getMembers } from '@/actions/members'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { MembersList } from '@/components/members/members-list'

export default async function MembrosPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    const members = await getMembers(profile.cell_id)

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/minha-celula">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Membros</h1>
                </div>
                <Link href="/minha-celula/membros/novo">
                    <Button size="icon" className="rounded-full h-10 w-10 shadow-lg">
                        <Plus className="h-6 w-6" />
                    </Button>
                </Link>
            </div>

            {/* Members List with Search, Filters, and Pagination */}
            <MembersList members={members} itemsPerPage={10} />
        </div>
    )
}
