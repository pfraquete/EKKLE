import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsNetworkMembers, getPotentialKidsNetworkMembers } from '@/actions/kids-network'
import { getActiveKidsCells } from '@/actions/kids-cells'
import { KIDS_ROLES_LABELS } from '@/lib/constants'
import Link from 'next/link'
import {
  Users,
  Plus,
  ArrowLeft,
  Crown,
  Shield,
  UserCheck,
  User
} from 'lucide-react'
import { AddMemberDialog } from './add-member-dialog'
import { MemberCard } from './member-card'

export default async function RedeKidsEquipePage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only Pastor or Pastora Kids or Discipuladora Kids can manage team
  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'

  if (!isPastor && !isPastoraKids && !isDiscipuladoraKids) {
    redirect('/rede-kids')
  }

  const members = await getKidsNetworkMembers()
  const potentialMembers = await getPotentialKidsNetworkMembers()
  const cells = await getActiveKidsCells()

  // Group members by role
  const groupedMembers = {
    PASTORA_KIDS: members.filter(m => m.kids_role === 'PASTORA_KIDS'),
    DISCIPULADORA_KIDS: members.filter(m => m.kids_role === 'DISCIPULADORA_KIDS'),
    LEADER_KIDS: members.filter(m => m.kids_role === 'LEADER_KIDS'),
    MEMBER_KIDS: members.filter(m => m.kids_role === 'MEMBER_KIDS'),
  }

  const canManage = isPastor || isPastoraKids || isDiscipuladoraKids
  const canChangeRoles = isPastor || isPastoraKids

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/rede-kids"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe Kids</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe da Rede Kids
            </p>
          </div>
        </div>
        {canManage && potentialMembers.length > 0 && (
          <AddMemberDialog
            potentialMembers={potentialMembers}
            cells={cells}
          />
        )}
      </div>

      {/* Members by role */}
      <div className="space-y-8">
        {/* Pastoras Kids */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Pastoras Kids</h2>
            <span className="text-sm text-muted-foreground">({groupedMembers.PASTORA_KIDS.length})</span>
          </div>
          {groupedMembers.PASTORA_KIDS.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nenhuma pastora kids cadastrada</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMembers.PASTORA_KIDS.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canChangeRoles={canChangeRoles}
                  canRemove={isPastor || isPastoraKids}
                  cells={cells}
                  currentUserId={profile.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Discipuladoras Kids */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Discipuladoras Kids</h2>
            <span className="text-sm text-muted-foreground">({groupedMembers.DISCIPULADORA_KIDS.length})</span>
          </div>
          {groupedMembers.DISCIPULADORA_KIDS.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nenhuma discipuladora kids cadastrada</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMembers.DISCIPULADORA_KIDS.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canChangeRoles={canChangeRoles}
                  canRemove={isPastor || isPastoraKids}
                  cells={cells}
                  currentUserId={profile.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Líderes Kids */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Líderes Kids</h2>
            <span className="text-sm text-muted-foreground">({groupedMembers.LEADER_KIDS.length})</span>
          </div>
          {groupedMembers.LEADER_KIDS.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nenhum líder kids cadastrado</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMembers.LEADER_KIDS.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canChangeRoles={canChangeRoles}
                  canRemove={isPastor || isPastoraKids}
                  cells={cells}
                  currentUserId={profile.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Membros Kids */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold">Membros Kids</h2>
            <span className="text-sm text-muted-foreground">({groupedMembers.MEMBER_KIDS.length})</span>
          </div>
          {groupedMembers.MEMBER_KIDS.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nenhum membro kids cadastrado</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMembers.MEMBER_KIDS.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canChangeRoles={canChangeRoles}
                  canRemove={isPastor || isPastoraKids}
                  cells={cells}
                  currentUserId={profile.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
