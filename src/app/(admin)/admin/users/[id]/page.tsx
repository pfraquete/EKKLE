import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserDetails } from '@/actions/super-admin/users'
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Building2,
    Calendar,
    Crown,
    Shield,
    UserCog,
    Grid3X3,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ImpersonateButton } from '../impersonate-button'
import { UserActions } from './user-actions'

interface UserDetailsPageProps {
    params: Promise<{ id: string }>
}

const roleLabels: Record<string, string> = {
    PASTOR: 'Pastor',
    DISCIPULADOR: 'Discipulador',
    LEADER: 'Lider',
    MEMBER: 'Membro'
}

const roleColors: Record<string, string> = {
    PASTOR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    DISCIPULADOR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    LEADER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEMBER: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

const roleIcons: Record<string, React.ReactNode> = {
    PASTOR: <Crown className="h-4 w-4" />,
    DISCIPULADOR: <Shield className="h-4 w-4" />,
    LEADER: <UserCog className="h-4 w-4" />,
    MEMBER: <User className="h-4 w-4" />
}

const stageLabels: Record<string, string> = {
    VISITOR: 'Visitante',
    REGULAR_VISITOR: 'Visitante Regular',
    MEMBER: 'Membro',
    GUARDIAN_ANGEL: 'Anjo Guardiao',
    TRAINING_LEADER: 'Lider em Treinamento',
    LEADER: 'Lider',
    PASTOR: 'Pastor'
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
    const { id } = await params
    const user = await getUserDetails(id)

    if (!user) {
        notFound()
    }

    const church = user.church as { id: string; name: string; slug: string; logo_url: string | null } | null
    const cell = user.cell as { id: string; name: string } | null

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para usuarios
            </Link>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.photo_url ? (
                            <img
                                src={user.photo_url}
                                alt={user.full_name || ''}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="h-8 w-8 text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-zinc-100">
                                {user.full_name || 'Sem nome'}
                            </h1>
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
                                roleColors[user.role] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                            )}>
                                {roleIcons[user.role]}
                                {roleLabels[user.role] || user.role}
                            </span>
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
                                user.is_active
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                            )}>
                                {user.is_active ? (
                                    <><CheckCircle className="h-3.5 w-3.5" /> Ativo</>
                                ) : (
                                    <><XCircle className="h-3.5 w-3.5" /> Inativo</>
                                )}
                            </span>
                        </div>
                        <p className="text-zinc-400 mt-1">{user.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ImpersonateButton
                        userId={user.id}
                        userName={user.full_name || user.email}
                        userEmail={user.email}
                    />
                    <UserActions user={user} />
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Informacoes de Contato</h2>
                    <div className="space-y-4">
                        <InfoRow
                            icon={<Mail className="h-4 w-4" />}
                            label="Email"
                            value={user.email}
                        />
                        {user.phone && (
                            <InfoRow
                                icon={<Phone className="h-4 w-4" />}
                                label="Telefone"
                                value={user.phone}
                            />
                        )}
                        <InfoRow
                            icon={<Calendar className="h-4 w-4" />}
                            label="Cadastrado"
                            value={`${format(new Date(user.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} (${formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })})`}
                        />
                    </div>
                </div>

                {/* Church Info */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Vinculo Eclesiastico</h2>
                    <div className="space-y-4">
                        {church ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        {church.logo_url ? (
                                            <img
                                                src={church.logo_url}
                                                alt={church.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 className="h-5 w-5 text-zinc-500" />
                                        )}
                                    </div>
                                    <div>
                                        <Link
                                            href={`/admin/churches/${church.id}`}
                                            className="font-medium text-zinc-200 hover:text-orange-400 transition-colors"
                                        >
                                            {church.name}
                                        </Link>
                                        <p className="text-xs text-zinc-500">{church.slug}.ekkle.com.br</p>
                                    </div>
                                </div>

                                {cell && (
                                    <InfoRow
                                        icon={<Grid3X3 className="h-4 w-4" />}
                                        label="Celula"
                                        value={cell.name}
                                    />
                                )}

                                {user.member_stage && (
                                    <InfoRow
                                        icon={<User className="h-4 w-4" />}
                                        label="Estagio"
                                        value={stageLabels[user.member_stage] || user.member_stage}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Building2 className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                                <p className="text-zinc-500">Usuario sem igreja vinculada</p>
                                <p className="text-xs text-zinc-600 mt-1">Este usuario pode ser do Ekkle Hub</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Informacoes Adicionais</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Role</p>
                        <p className="font-medium text-zinc-200">{roleLabels[user.role] || user.role}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                        <p className={cn(
                            'font-medium',
                            user.is_active ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                        </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Professor</p>
                        <p className="font-medium text-zinc-200">{user.is_teacher ? 'Sim' : 'Nao'}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Equipe Financeira</p>
                        <p className="font-medium text-zinc-200">{user.is_finance_team ? 'Sim' : 'Nao'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-zinc-500 mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
                <p className="text-zinc-200">{value}</p>
            </div>
        </div>
    )
}
