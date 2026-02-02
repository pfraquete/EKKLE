import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsNetworkStats } from '@/actions/kids-network'
import { getKidsCellsWithStats } from '@/actions/kids-cells'
import Link from 'next/link'
import {
  Users,
  Home,
  Baby,
  UserCheck,
  Shield,
  Crown,
  Plus,
  ChevronRight
} from 'lucide-react'

export default async function RedeKidsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only Pastor or Kids Network members can access
  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    redirect('/dashboard')
  }

  const stats = await getKidsNetworkStats()
  const cells = await getKidsCellsWithStats()

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
  const canManage = isPastor || isPastoraKids || isDiscipuladoraKids

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rede Kids</h1>
          <p className="text-muted-foreground">
            Gerencie a rede de células kids da sua igreja
          </p>
        </div>
        {(isPastor || isPastoraKids) && (
          <div className="flex gap-2">
            <Link
              href="/rede-kids/equipe"
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Users className="h-4 w-4" />
              Equipe
            </Link>
            <Link
              href="/rede-kids/celulas/nova"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Célula
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Total Equipe</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Home className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeCells}</p>
              <p className="text-xs text-muted-foreground">Células Ativas</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Baby className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeChildren}</p>
              <p className="text-xs text-muted-foreground">Crianças</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.discipuladorasKids}</p>
              <p className="text-xs text-muted-foreground">Discipuladoras</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Team breakdown */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Equipe por Função</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <span>Pastoras Kids</span>
              </div>
              <span className="font-semibold">{stats.pastorasKids}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-500" />
                <span>Discipuladoras Kids</span>
              </div>
              <span className="font-semibold">{stats.discipuladorasKids}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-blue-500" />
                <span>Líderes Kids</span>
              </div>
              <span className="font-semibold">{stats.leadersKids}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <span>Membros Kids</span>
              </div>
              <span className="font-semibold">{stats.membersKids}</span>
            </div>
          </div>
          {canManage && (
            <Link
              href="/rede-kids/equipe"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:underline"
            >
              Ver toda equipe
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Recent cells */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Células Kids</h2>
            <Link
              href="/rede-kids/celulas"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {cells.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma célula kids cadastrada</p>
              {(isPastor || isPastoraKids) && (
                <Link
                  href="/rede-kids/celulas/nova"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeira célula
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {cells.slice(0, 5).map((cell) => (
                <Link
                  key={cell.id}
                  href={`/rede-kids/celulas/${cell.id}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{cell.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cell.leader?.full_name || 'Sem líder'} • {cell.children_count} crianças
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions for specific roles */}
      {isDiscipuladoraKids && !isPastoraKids && !isPastor && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Suas Células</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Como Discipuladora Kids, você supervisiona células kids específicas.
          </p>
          <Link
            href="/rede-kids/supervisao"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Ver minhas células
          </Link>
        </div>
      )}
    </div>
  )
}
