import { getKidsChildren, getKidsChildrenStats } from '@/actions/kids-children'
import { getKidsCells } from '@/actions/kids-cells'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Baby,
    Plus,
    Search,
    Users,
    Cake,
    AlertTriangle,
    ChevronRight,
    Phone,
    Home
} from 'lucide-react'
import { Input } from '@/components/ui/input'

function calculateAge(birthDate: string): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}

export default async function KidsCriancasPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const [children, stats, cells] = await Promise.all([
        getKidsChildren(),
        getKidsChildrenStats(),
        getKidsCells()
    ])

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Criancas</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">
                        Rede Kids - Gerenciamento de Criancas
                    </p>
                </div>
                <Link href="/rede-kids/criancas/nova">
                    <Button className="rounded-xl font-bold shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Crianca
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Baby className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.total}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">
                                {stats.genderStats.M} / {stats.genderStats.F}
                            </p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">M / F</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.withoutCell}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Sem Celula</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Cake className="w-6 h-6 text-pink-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">{stats.birthdaysThisMonth.length}</p>
                            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Aniversarios</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar crianca por nome..."
                    className="pl-10 h-12 bg-background rounded-2xl border-border shadow-sm"
                />
            </div>

            {/* Children List */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Criancas Cadastradas ({children.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {children.length === 0 ? (
                        <div className="p-20 text-center">
                            <Baby className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">
                                Nenhuma crianca cadastrada ainda.
                            </p>
                            <Link href="/rede-kids/criancas/nova">
                                <Button className="mt-4 rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Cadastrar Primeira Crianca
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {children.map(child => (
                                <Link
                                    key={child.id}
                                    href={`/rede-kids/criancas/${child.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                            <AvatarFallback className={`font-bold ${child.gender === 'M' ? 'bg-blue-500/10 text-blue-500' : child.gender === 'F' ? 'bg-pink-500/10 text-pink-500' : 'bg-muted text-muted-foreground'}`}>
                                                {child.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-foreground truncate">
                                                    {child.full_name}
                                                </h4>
                                                {child.birth_date && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {calculateAge(child.birth_date)} anos
                                                    </Badge>
                                                )}
                                                {child.allergies && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Alergia
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-0.5">
                                                {child.kids_cell && (
                                                    <span className="flex items-center gap-1">
                                                        <Home className="h-3 w-3" />
                                                        {child.kids_cell.name}
                                                    </span>
                                                )}
                                                {child.parent_phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {child.parent_phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Birthdays This Month */}
            {stats && stats.birthdaysThisMonth.length > 0 && (
                <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                    <CardHeader className="bg-pink-500/10 border-b border-pink-500/20">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-pink-500 flex items-center gap-2">
                            <Cake className="w-4 h-4" />
                            Aniversariantes do Mes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {stats.birthdaysThisMonth.map(child => (
                                <Link key={child.id} href={`/rede-kids/criancas/${child.id}`}>
                                    <Badge variant="outline" className="py-2 px-3 hover:bg-muted transition-colors cursor-pointer">
                                        <Cake className="w-3 h-3 mr-2 text-pink-500" />
                                        {child.full_name}
                                        {child.birth_date && (
                                            <span className="ml-2 text-muted-foreground">
                                                {new Date(child.birth_date).getDate()}/{new Date(child.birth_date).getMonth() + 1}
                                            </span>
                                        )}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
