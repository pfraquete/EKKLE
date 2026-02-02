import { getKidsChildById } from '@/actions/kids-children'
import { getProfile } from '@/actions/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    ArrowLeft,
    Baby,
    Calendar,
    Phone,
    Mail,
    Home,
    AlertTriangle,
    Stethoscope,
    User,
    Edit,
    Trash2,
    Cake
} from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EditChildDialog } from './edit-child-dialog'
import { DeleteChildDialog } from './delete-child-dialog'

export default async function CriancaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const profile = await getProfile()
    if (!profile) redirect('/login')

    const child = await getKidsChildById(id)
    if (!child) notFound()

    const age = child.birth_date
        ? differenceInYears(new Date(), new Date(child.birth_date))
        : null

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rede-kids/criancas">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-foreground">Detalhes da Crianca</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Rede Kids
                    </p>
                </div>
                <div className="flex gap-2">
                    <EditChildDialog child={child} />
                    <DeleteChildDialog childId={child.id} childName={child.full_name} />
                </div>
            </div>

            {/* Profile Card */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <div className={`h-24 ${child.gender === 'M' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : child.gender === 'F' ? 'bg-gradient-to-r from-pink-500 to-pink-600' : 'bg-gradient-to-r from-primary to-primary/80'}`} />
                <CardContent className="relative pt-0 pb-6 px-6">
                    <div className="flex flex-col sm:flex-row gap-4 -mt-12 items-start sm:items-end">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarFallback className={`text-2xl font-bold ${child.gender === 'M' ? 'bg-blue-100 text-blue-600' : child.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-muted'}`}>
                                {child.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-black">{child.full_name}</h2>
                                {age !== null && (
                                    <Badge variant="secondary" className="font-bold">
                                        {age} anos
                                    </Badge>
                                )}
                                {child.gender && (
                                    <Badge variant="outline" className={child.gender === 'M' ? 'text-blue-500 border-blue-500' : 'text-pink-500 border-pink-500'}>
                                        {child.gender === 'M' ? 'Menino' : 'Menina'}
                                    </Badge>
                                )}
                            </div>
                            {child.kids_cell && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Home className="w-4 h-4" />
                                    <span>{child.kids_cell.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Dados Pessoais */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
                            <Baby className="w-4 h-4" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</p>
                            <p className="font-medium">{child.full_name}</p>
                        </div>

                        {child.birth_date && (
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Cake className="w-3 h-3" /> Data de Nascimento
                                </p>
                                <p className="font-medium">
                                    {format(new Date(child.birth_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        )}

                        {child.gender && (
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Genero</p>
                                <p className="font-medium">{child.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
                            </div>
                        )}

                        {child.kids_cell && (
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Home className="w-3 h-3" /> Celula Kids
                                </p>
                                <Link href={`/rede-kids/celulas/${child.kids_cell.id}`}>
                                    <Badge variant="secondary" className="cursor-pointer hover:bg-muted">
                                        {child.kids_cell.name}
                                    </Badge>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dados do Responsavel */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-blue-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-600">
                            <User className="w-4 h-4" />
                            Responsavel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {child.parent_name ? (
                            <>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</p>
                                    <p className="font-medium">{child.parent_name}</p>
                                </div>

                                {child.parent_phone && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> Telefone
                                        </p>
                                        <a href={`tel:${child.parent_phone}`} className="font-medium text-primary hover:underline">
                                            {child.parent_phone}
                                        </a>
                                    </div>
                                )}

                                {child.parent_email && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> Email
                                        </p>
                                        <a href={`mailto:${child.parent_email}`} className="font-medium text-primary hover:underline">
                                            {child.parent_email}
                                        </a>
                                    </div>
                                )}

                                {child.parent_profile && (
                                    <div className="pt-2 border-t border-border">
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Membro da Igreja
                                        </Badge>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Responsavel nao cadastrado</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Informacoes Medicas */}
            {(child.allergies || child.medical_notes) && (
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden border-2 border-red-500/20">
                    <CardHeader className="bg-red-500/5 border-b border-red-500/20">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-600">
                            <Stethoscope className="w-4 h-4" />
                            Informacoes Medicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {child.allergies && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Alergias
                                </p>
                                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                                    <p className="text-sm">{child.allergies}</p>
                                </div>
                            </div>
                        )}

                        {child.medical_notes && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Observacoes Medicas
                                </p>
                                <div className="p-3 bg-muted/30 rounded-xl">
                                    <p className="text-sm">{child.medical_notes}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="border-none shadow-sm rounded-2xl bg-muted/30">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground text-center">
                        Cadastrado em {format(new Date(child.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        {child.updated_at !== child.created_at && (
                            <> - Atualizado em {format(new Date(child.updated_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</>
                        )}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
