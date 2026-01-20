import { getMembers } from '@/actions/members'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    ChevronLeft,
    Plus,
    Search,
    Phone,
    Mail,
    MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

export default async function MembrosPage() {
    const profile = await getProfile()
    if (!profile || !profile.cell_id) redirect('/login')

    const members = await getMembers(profile.cell_id)

    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'VISITOR': return <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">Visitante</Badge>
            case 'REGULAR_VISITOR': return <Badge variant="outline" className="text-amber-300 border-amber-500/30 bg-amber-500/10">Frequenta</Badge>
            case 'MEMBER': return <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10">Membro</Badge>
            case 'LEADER': return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Líder</Badge>
            default: return null
        }
    }

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

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar membro..."
                    className="pl-10 h-12 bg-background rounded-2xl border-border shadow-sm"
                />
            </div>

            {/* Stats */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                <Badge className="bg-primary/10 text-primary border-none font-bold whitespace-nowrap px-4 py-2 rounded-full">
                    Todos ({members.length})
                </Badge>
                <Badge variant="outline" className="text-muted-foreground border-border whitespace-nowrap px-4 py-2 rounded-full font-bold">
                    Visitantes
                </Badge>
                <Badge variant="outline" className="text-muted-foreground border-border whitespace-nowrap px-4 py-2 rounded-full font-bold">
                    Membros
                </Badge>
            </div>

            {/* Members List */}
            <div className="grid grid-cols-1 gap-4">
                {members.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                        <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Nenhum membro encontrado.</p>
                    </div>
                ) : (
                    members.map(member => (
                        <Link key={member.id} href={`/minha-celula/membros/${member.id}`}>
                            <Card className="border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm shrink-0">
                                        <AvatarImage src={member.photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-foreground truncate">{member.full_name}</p>
                                            {getStageBadge(member.member_stage)}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                            {member.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {member.phone}
                                                </span>
                                            )}
                                            {member.email && !member.phone && (
                                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                    <Mail className="h-3 w-3" />
                                                    {member.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground/50">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
