export const dynamic = 'force-dynamic'

import { getMemberDetails } from '@/actions/members'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ChevronLeft,
    Calendar,
    Home,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function MemberDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const { member, attendance } = await getMemberDetails(id)

    if (!member) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted-foreground">Membro não encontrado.</p>
                <Link href="/membros">
                    <Button variant="link">Voltar para a lista</Button>
                </Link>
            </div>
        )
    }

    const STAGE_LABELS: Record<string, string> = {
        'VISITOR': 'Visitante',
        'REGULAR_VISITOR': 'Visitante Frequente',
        'MEMBER': 'Membro',
        'LEADER': 'Líder',
        'PASTOR': 'Pastor'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <Link href="/membros">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-black text-foreground">Perfil do Membro</h1>
            </div>

            {/* Profile Summary Card */}
            <Card className="border-none shadow-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />
                <CardContent className="relative pt-0 pb-6 px-6">
                    <div className="flex flex-col md:flex-row gap-6 -mt-12 items-start md:items-end">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={member.photo_url} />
                            <AvatarFallback className="text-2xl font-bold bg-muted">
                                {member.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-black">{member.full_name}</h2>
                                <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest">
                                    {STAGE_LABELS[member.member_stage] || member.member_stage}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Home className="h-4 w-4" />
                                    {member.cell?.name || 'Sem Célula'}
                                </span>
                                {member.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-4 w-4" />
                                        {member.phone}
                                    </span>
                                )}
                                {member.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-4 w-4" />
                                        {member.email}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="flex-1 md:flex-none font-bold rounded-xl border-2">Editar</Button>
                            <Button className="flex-1 md:flex-none font-bold rounded-xl shadow-lg">Enviar Mensagem</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="timeline" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
                    <TabsTrigger value="timeline" className="rounded-lg font-bold">Timeline</TabsTrigger>
                    <TabsTrigger value="presenca" className="rounded-lg font-bold">Histórico de Presença</TabsTrigger>
                    <TabsTrigger value="dados" className="rounded-lg font-bold">Dados Detalhados</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-6 outline-none">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Jornada de Engajamento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-muted/50">
                                    {/* Mocking journey events for now based on current stage */}
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 mt-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold">Estágio Atual: {STAGE_LABELS[member.member_stage]}</p>
                                            <p className="text-xs text-muted-foreground">Membro ativo no sistema Ekkle</p>
                                        </div>
                                    </div>

                                    <div className="relative pl-10">
                                        <div className="absolute left-0 mt-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-muted bg-background" />
                                        <div className="space-y-1 text-muted-foreground">
                                            <p className="text-sm font-bold">Primeiro Contato</p>
                                            <p className="text-xs">
                                                {format(new Date(member.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Estatísticas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center rounded-xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-bold">Presenças</p>
                                        </div>
                                        <p className="text-xl font-black">{attendance.filter(a => a.status === 'PRESENT').length}</p>
                                    </div>

                                    <div className="flex justify-between items-center rounded-xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                                                <XCircle className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-bold">Faltas</p>
                                        </div>
                                        <p className="text-xl font-black">{attendance.filter(a => a.status === 'ABSENT').length}</p>
                                    </div>

                                    <div className="flex justify-between items-center rounded-xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-bold">Próximo Aniversário</p>
                                        </div>
                                        <p className="text-sm font-black">
                                            {member.birthday ? format(new Date(member.birthday), 'dd/MM') : '--/--'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="presenca" className="outline-none">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Histórico de Reuniões</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {attendance.length > 0 ? (
                                <div className="space-y-4">
                                    {attendance.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${record.status === 'PRESENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {record.status === 'PRESENT' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{record.context_type === 'CELL_MEETING' ? 'Célula' : 'Culto'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(record.context_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={record.status === 'PRESENT' ? 'default' : 'destructive'} className="font-bold">
                                                {record.status === 'PRESENT' ? 'Presente' : 'Ausente'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Nenhum registro de presença encontrado para este membro.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="dados" className="outline-none">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Dados do Cadastro</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</p>
                                <p className="font-medium">{member.full_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</p>
                                <p className="font-medium">{member.phone || 'Não informado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</p>
                                <p className="font-medium">{member.email || 'Não informado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</p>
                                <p className="font-medium">
                                    {member.birthday ? format(new Date(member.birthday), "d 'de' MMMM", { locale: ptBR }) : 'Não informado'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID do Sistema</p>
                                <p className="text-xs font-mono text-muted-foreground">{member.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
