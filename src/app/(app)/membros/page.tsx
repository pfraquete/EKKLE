import { getChurchMembers } from '@/actions/admin'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import Link from 'next/link'
import { Input } from '@/components/ui/input'

export default async function MembersPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // Only PASTOR can see this general members page
    if (profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const members = await getChurchMembers(profile.church_id)

    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'VISITOR': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Visitante</Badge>
            case 'REGULAR_VISITOR': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Frequenta</Badge>
            case 'MEMBER': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Membro</Badge>
            case 'LEADER': return <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Líder</Badge>
            default: return null
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Membros</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">Lista geral da igreja • Videira SJC</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar por nome ou célula..."
                    className="pl-10 h-12 bg-white rounded-2xl border-gray-100 shadow-sm"
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 text-center">
                    <p className="text-2xl font-black text-gray-900">{members.length}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total</p>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 text-center">
                    <p className="text-2xl font-black text-green-600">
                        {members.filter(m => m.member_stage === 'MEMBER').length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Membros</p>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 text-center">
                    <p className="text-2xl font-black text-blue-600">
                        {members.filter(m => m.member_stage === 'VISITOR').length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Visitantes</p>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 text-center">
                    <p className="text-2xl font-black text-primary">
                        {members.filter(m => m.member_stage === 'LEADER').length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Líderes</p>
                </div>
            </div>

            {/* Members List */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {members.length === 0 ? (
                            <div className="p-20 text-center">
                                <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Nenhum membro cadastrado.</p>
                            </div>
                        ) : (
                            members.map(member => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                            <AvatarImage src={member.photo_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 truncate">{member.full_name}</h4>
                                                {getStageBadge(member.member_stage)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                                                <Home className="h-3 w-3" />
                                                <span className="truncate">{member.cell?.name || 'Sem Célula'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex flex-col items-end text-xs font-medium text-gray-400">
                                            {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.phone}</span>}
                                            {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
