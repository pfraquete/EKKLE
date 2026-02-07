'use client'

import { useState } from 'react'
import { updateMemberRole } from '@/actions/members'
import { toast } from 'sonner'
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface RoleEditorProps {
  memberId: string
  currentRole: string
  memberName: string
}

const ROLE_CONFIG = {
  MEMBER: {
    label: 'Membro',
    description: 'Acesso padrão ao sistema',
    icon: Shield,
    color: 'text-muted-foreground',
    badgeVariant: 'secondary' as const,
  },
  LEADER: {
    label: 'Líder',
    description: 'Acesso administrativo à célula',
    icon: ShieldCheck,
    color: 'text-blue-500',
    badgeVariant: 'default' as const,
  },
  PASTOR: {
    label: 'Pastor',
    description: 'Acesso total ao sistema',
    icon: ShieldAlert,
    color: 'text-amber-500',
    badgeVariant: 'destructive' as const,
  },
} as const

type RoleKey = keyof typeof ROLE_CONFIG

export function RoleEditor({ memberId, currentRole, memberName }: RoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const hasChanged = selectedRole !== currentRole
  const roleConfig = ROLE_CONFIG[selectedRole as RoleKey] || ROLE_CONFIG.MEMBER
  const CurrentIcon = roleConfig.icon

  async function handleSave() {
    setSaving(true)
    setConfirmOpen(false)

    const result = await updateMemberRole(memberId, selectedRole as 'MEMBER' | 'LEADER' | 'PASTOR')

    if (result.success) {
      toast.success(`Permissão de ${memberName} alterada para ${ROLE_CONFIG[selectedRole as RoleKey]?.label}`)
    } else {
      toast.error(result.error || 'Erro ao alterar permissão')
      setSelectedRole(currentRole) // Revert on error
    }

    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <CurrentIcon className={`h-5 w-5 ${roleConfig.color}`} />
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ROLE_CONFIG) as [RoleKey, typeof ROLE_CONFIG[RoleKey]][]).map(([key, config]) => {
              const Icon = config.icon
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {hasChanged && (
          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={saving}
            className="font-bold"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {roleConfig.description}
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar permissão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar a permissão de <strong>{memberName}</strong> de{' '}
              <Badge variant={ROLE_CONFIG[currentRole as RoleKey]?.badgeVariant || 'secondary'} className="mx-1">
                {ROLE_CONFIG[currentRole as RoleKey]?.label || currentRole}
              </Badge>{' '}
              para{' '}
              <Badge variant={ROLE_CONFIG[selectedRole as RoleKey]?.badgeVariant || 'secondary'} className="mx-1">
                {ROLE_CONFIG[selectedRole as RoleKey]?.label || selectedRole}
              </Badge>
              . Esta ação afeta o nível de acesso do usuário no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
