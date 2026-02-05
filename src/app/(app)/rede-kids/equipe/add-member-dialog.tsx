'use client'

import { useState, useTransition } from 'react'
import { Plus, Search, X, Users, AlertCircle } from 'lucide-react'
import { addToKidsNetwork } from '@/actions/kids-network'
import { KIDS_ROLES_LABELS } from '@/lib/constants'
import { KidsCell } from '@/actions/kids-cells'

interface PotentialMember {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  photo_url: string | null
  role: string
}

interface AddMemberDialogProps {
  potentialMembers: PotentialMember[]
  cells: KidsCell[]
}

export function AddMemberDialog({ potentialMembers, cells }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<PotentialMember | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER_KIDS')
  const [selectedCell, setSelectedCell] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filteredMembers = potentialMembers.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = () => {
    if (!selectedMember) return

    setError(null)
    startTransition(async () => {
      try {
        await addToKidsNetwork({
          profileId: selectedMember.id,
          kidsRole: selectedRole,
          kidsCellId: selectedCell || null,
        })
        setIsOpen(false)
        setSelectedMember(null)
        setSelectedRole('MEMBER_KIDS')
        setSelectedCell('')
        setSearch('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao adicionar membro')
      }
    })
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedMember(null)
    setSelectedRole('MEMBER_KIDS')
    setSelectedCell('')
    setSearch('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar Membro
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-lg text-foreground">Adicionar à Rede Kids</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Empty state - no potential members */}
              {potentialMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Todos os membros já estão na Rede Kids</h3>
                  <p className="text-sm text-muted-foreground">
                    Não há membros disponíveis para adicionar. Todos os membros da igreja já fazem parte da Rede Kids.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Para adicionar novos membros, primeiro cadastre-os na seção de Membros da igreja.
                  </p>
                </div>
              ) : !selectedMember ? (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar membro..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Members list */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {search ? 'Nenhum membro encontrado com esse nome' : 'Nenhum membro disponível'}
                        </p>
                      </div>
                    ) : (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={member.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {member.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Total count */}
                  <p className="text-xs text-muted-foreground text-center">
                    {potentialMembers.length} membro{potentialMembers.length !== 1 ? 's' : ''} disponíve{potentialMembers.length !== 1 ? 'is' : 'l'}
                  </p>
                </>
              ) : (
                <>
                  {/* Selected member */}
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                    {selectedMember.photo_url ? (
                      <img
                        src={selectedMember.photo_url}
                        alt={selectedMember.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {selectedMember.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{selectedMember.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="p-1 hover:bg-primary/20 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Role selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Função na Rede Kids
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(KIDS_ROLES_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cell selection (optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Célula Kids (opcional)
                    </label>
                    <select
                      value={selectedCell}
                      onChange={(e) => setSelectedCell(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sem célula</option>
                      {cells.map((cell) => (
                        <option key={cell.id} value={cell.id}>
                          {cell.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-foreground"
              >
                {potentialMembers.length === 0 ? 'Fechar' : 'Cancelar'}
              </button>
              {selectedMember && (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Adicionando...' : 'Adicionar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
