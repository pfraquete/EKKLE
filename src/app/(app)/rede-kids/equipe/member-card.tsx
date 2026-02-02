'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Trash2, UserCog, Home } from 'lucide-react'
import { updateKidsNetworkRole, removeFromKidsNetwork, assignToKidsCell } from '@/actions/kids-network'
import { KIDS_ROLES_LABELS } from '@/lib/constants'
import { KidsNetworkMember } from '@/actions/kids-network'
import { KidsCell } from '@/actions/kids-cells'

interface MemberCardProps {
  member: KidsNetworkMember
  canChangeRoles: boolean
  canRemove: boolean
  cells: KidsCell[]
  currentUserId: string
}

export function MemberCard({ member, canChangeRoles, canRemove, cells, currentUserId }: MemberCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isCellModalOpen, setIsCellModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(member.kids_role)
  const [selectedCell, setSelectedCell] = useState(member.kids_cell_id || '')
  const [isPending, startTransition] = useTransition()

  const isCurrentUser = member.profile_id === currentUserId

  const handleRoleChange = () => {
    startTransition(async () => {
      try {
        await updateKidsNetworkRole(member.profile_id, selectedRole)
        setIsRoleModalOpen(false)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleCellChange = () => {
    startTransition(async () => {
      try {
        await assignToKidsCell(member.profile_id, selectedCell || null)
        setIsCellModalOpen(false)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeFromKidsNetwork(member.profile_id)
        setIsRemoveModalOpen(false)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <>
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-start gap-3">
          {member.profile.photo_url ? (
            <img
              src={member.profile.photo_url}
              alt={member.profile.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {member.profile.full_name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {KIDS_ROLES_LABELS[member.kids_role as keyof typeof KIDS_ROLES_LABELS]}
            </p>
            {member.kids_cell && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                <Home className="h-3 w-3" />
                {member.kids_cell.name}
              </p>
            )}
          </div>
          {(canChangeRoles || canRemove) && !isCurrentUser && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-20 py-1">
                    {canChangeRoles && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsRoleModalOpen(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <UserCog className="h-4 w-4" />
                        Alterar função
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsCellModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      Atribuir célula
                    </button>
                    {canRemove && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsRemoveModalOpen(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover da rede
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-4">Alterar Função</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Alterando função de <strong>{member.profile.full_name}</strong>
            </p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            >
              {Object.entries(KIDS_ROLES_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRoleChange}
                disabled={isPending || selectedRole === member.kids_role}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cell Assignment Modal */}
      {isCellModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-4">Atribuir Célula</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Atribuindo célula para <strong>{member.profile.full_name}</strong>
            </p>
            <select
              value={selectedCell}
              onChange={(e) => setSelectedCell(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            >
              <option value="">Sem célula</option>
              {cells.map((cell) => (
                <option key={cell.id} value={cell.id}>
                  {cell.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsCellModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCellChange}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-4">Remover da Rede Kids</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja remover <strong>{member.profile.full_name}</strong> da Rede Kids?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsRemoveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
