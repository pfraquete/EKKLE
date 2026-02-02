import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsCell, getCellSupervision, getAvailableDiscipuladorasKids, AvailableDiscipuladora } from '@/actions/kids-cells'
import { getKidsNetworkMembers } from '@/actions/kids-network'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Baby,
  Shield,
  Edit,
  Trash2
} from 'lucide-react'
import { EditCellDialog } from './edit-cell-dialog'
import { DeleteCellDialog } from './delete-cell-dialog'
import { AssignSupervisionDialog } from './assign-supervision-dialog'

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  params: Promise<{ id: string }>
}

export default async function CelulaKidsDetailPage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
    redirect('/dashboard')
  }

  const cell = await getKidsCell(id)

  if (!cell) {
    notFound()
  }

  const supervision = await getCellSupervision(id)
  const allMembers = await getKidsNetworkMembers()
  const cellMembers = allMembers.filter(m => m.kids_cell_id === id)

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
  const canEdit = isPastor || isPastoraKids

  // Get available discipuladoras for supervision
  const availableDiscipuladoras = canEdit ? await getAvailableDiscipuladorasKids() : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/rede-kids/celulas"
            className="p-2 hover:bg-muted rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{cell.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                cell.status === 'ACTIVE'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-gray-500/10 text-gray-600'
              }`}>
                {cell.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <p className="text-muted-foreground">
              {cell.leader?.full_name || 'Sem líder definido'}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <EditCellDialog cell={cell} />
            <DeleteCellDialog cellId={cell.id} cellName={cell.name} />
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cell Info */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Informações</h2>
          <div className="space-y-4">
            {cell.day_of_week !== null && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dia e Horário</p>
                  <p className="font-medium">
                    {DAYS_OF_WEEK[cell.day_of_week]}
                    {cell.meeting_time && ` às ${cell.meeting_time.slice(0, 5)}`}
                  </p>
                </div>
              </div>
            )}
            {(cell.address || cell.neighborhood) && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">
                    {cell.address && <span>{cell.address}</span>}
                    {cell.address && cell.neighborhood && <br />}
                    {cell.neighborhood && <span className="text-muted-foreground">{cell.neighborhood}</span>}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Baby className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Faixa Etária</p>
                <p className="font-medium">{cell.age_range_min} - {cell.age_range_max} anos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervision */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Supervisão</h2>
            {canEdit && (
              <AssignSupervisionDialog
                cellId={cell.id}
                currentSupervision={supervision}
                availableDiscipuladoras={availableDiscipuladoras}
              />
            )}
          </div>
          {supervision ? (
            <div className="flex items-center gap-3">
              {supervision.discipuladora?.photo_url ? (
                <img
                  src={supervision.discipuladora.photo_url}
                  alt={supervision.discipuladora.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{supervision.discipuladora?.full_name}</p>
                <p className="text-sm text-muted-foreground">Discipuladora Kids</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem supervisão atribuída</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Estatísticas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{cellMembers.length}</p>
              <p className="text-xs text-muted-foreground">Membros</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-center">
              <Baby className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Crianças</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Membros da Célula ({cellMembers.length})</h2>
        {cellMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum membro nesta célula</p>
            <p className="text-sm mt-1">
              Atribua membros da equipe kids a esta célula pela página de equipe
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cellMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {member.profile.photo_url ? (
                  <img
                    src={member.profile.photo_url}
                    alt={member.profile.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {member.profile.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.kids_role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
