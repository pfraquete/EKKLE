import { getFinanceTeam, getMembersNotInFinanceTeam } from '@/actions/finance-team'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowLeft,
    Users,
    UserPlus,
    Shield,
    Trash2,
    Calendar
} from 'lucide-react'
import { FinanceTeamActions } from '@/components/finance-team/finance-team-actions'
import { AddFinanceTeamMember } from '@/components/finance-team/add-finance-team-member'

export default async function DashboardEquipeFinanceiroPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const [teamResult, membersResult] = await Promise.all([
        getFinanceTeam(),
        getMembersNotInFinanceTeam(),
    ])

    const team = teamResult.success ? teamResult.data || [] : []
    const availableMembers = membersResult.success ? membersResult.data || [] : []

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link
                        href="/dashboard/financeiro"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Equipe Financeira</h1>
                    <p className="text-muted-foreground">
                        Gerencie quem tem acesso ao financeiro da igreja
                    </p>
                </div>
                <AddFinanceTeamMember availableMembers={availableMembers} />
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground mb-1">Permissões da Equipe</h3>
                        <p className="text-sm text-muted-foreground">
                            Membros da equipe financeira podem:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Visualizar e confirmar dízimos dos membros</li>
                            <li>• Ver o caixa de todas as células</li>
                            <li>• Registrar entradas e saídas financeiras</li>
                            <li>• Acessar relatórios financeiros</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Team List */}
            {team.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhum membro na equipe
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Adicione membros para ajudar na gestão financeira
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="font-bold text-foreground">
                            Membros da Equipe ({team.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-border">
                        {team.map((member: any) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                                        {member.member?.photo_url ? (
                                            <Image
                                                src={member.member.photo_url}
                                                alt={member.member.full_name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
                                                {(member.member?.full_name || 'M')[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {member.member?.full_name || 'Membro'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {member.member?.email}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            Adicionado em {new Date(member.created_at).toLocaleDateString('pt-BR')}
                                            {member.added_by_profile && (
                                                <span> por {member.added_by_profile.full_name}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <FinanceTeamActions profileId={member.profile_id} memberName={member.member?.full_name} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
