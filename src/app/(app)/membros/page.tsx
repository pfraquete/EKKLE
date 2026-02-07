import { getChurchMembersOptimized } from '@/actions/members-optimized'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Search,
    Phone,
    Mail,
    ChevronRight,
    Home
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface ChurchMember {
    id: string
    full_name: string
    photo_url: string | null
    member_stage: string
    phone: string | null
    email: string | null
    cell: { name: string | null } | null
}

export default async function MembersPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // Only PASTOR can see this general members page
    if (profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const members = await getChurchMembersOptimized() as ChurchMember[]

    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'VISITOR':
                return <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">Visitante</Badge>
            case 'REGULAR_VISITOR':
                return <Badge variant="outline" className="text-amber-300 border-amber-500/30 bg-amber-500/10">Frequenta</Badge>
            case 'MEMBER':
                return <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10">Membro</Badge>
            case 'GUARDIAN_ANGEL':
                return <Badge variant="outline" className="text-purple-300 border-purple-500/30 bg-purple-500/10">Anjo da Guarda</Badge>
            case 'TRAINING_LEADER':
                return <Badge variant="outline" className="text-indigo-300 border-indigo-500/30 bg-indigo-500/10">Líder em Treinamento</Badge>
            case 'LEADER':
                return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Líder</Badge>
            case 'PASTOR':
                return <Badge variant="outline" className="text-yellow-300 border-yellow-500/30 bg-yellow-500/10">Pastor</Badge>
            default:
                return null
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Membros</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Lista geral • Ekkle</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou célula..."
                    className="pl-10 h-12 bg-background rounded-2xl border-border shadow-sm"
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-3xl shadow-sm border border-border text-center">
                    <p className="text-2xl font-black text-foreground">{members.length}</p>
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total</p>
                </div>
                <div className="bg-card p-4 rounded-3xl shadow-sm border border-border text-center">
                    <p className="text-2xl font-black text-green-500">
                        {members.filter(m => m.member_stage === 'MEMBER').length}
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Membros</p>
                </div>
                <div className="bg-card p-4 rounded-3xl shadow-sm border border-border text-center">
                    <p className="text-2xl font-black text-blue-500">
                        {members.filter(m => m.member_stage === 'VISITOR').length}
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Visitantes</p>
                </div>
                <div className="bg-card p-4 rounded-3xl shadow-sm border border-border text-center">
                    <p className="text-2xl font-black text-primary">
                        {members.filter(m => m.member_stage === 'LEADER').length}
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Líderes</p>
                </div>
            </div>

            {/* Members List */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {members.length === 0 ? (
                            <div className="p-20 text-center">
                                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhum membro cadastrado.</p>
                            </div>
                        ) : (
                            members.map(member => (
                                <Link
                                    key={member.id}
                                    href={`/membros/${member.id}`}
                                    className="flex items-center justify-between p-4 min-h-[72px] hover:bg-muted/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                                            <AvatarImage src={member.photo_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {(member.full_name || 'Sem Nome').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-foreground truncate">{member.full_name}</h4>
                                                {getStageBadge(member.member_stage)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5">
                                                <Home className="h-3 w-3" />
                                                <span className="truncate">{member.cell?.name || 'Sem Célula'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex flex-col items-end text-xs font-medium text-muted-foreground">
                                            {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.phone}</span>}
                                            {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
