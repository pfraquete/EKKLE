import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Home, MapPin, Clock, Users } from 'lucide-react'
import { RequestCellMembershipButton } from '@/components/cells/request-cell-membership-button'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function MembroCelulasPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check current cell
  const { data: profile } = await supabase
    .from('profiles')
    .select('cell_id, full_name')
    .eq('id', user.id)
    .single()

  // Get all active cells
  const { data: cells } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      description,
      day_of_week,
      meeting_time,
      address,
      neighborhood,
      leader:profiles!cells_leader_id_fkey(
        id,
        full_name
      )
    `)
    .eq('church_id', church.id)
    .eq('status', 'ACTIVE')
    .order('name')

  // Get member counts for each cell
  const cellsWithCounts = await Promise.all(
    (cells || []).map(async (cell) => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('cell_id', cell.id)

      return {
        ...cell,
        membersCount: count || 0
      }
    })
  )

  // Get user's pending requests
  const { data: pendingRequests } = await supabase
    .from('cell_requests')
    .select('cell_id')
    .eq('profile_id', user.id)
    .eq('status', 'PENDING')

  const pendingCellIds = new Set(pendingRequests?.map(r => r.cell_id) || [])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Células Disponíveis</h1>
        <p className="text-gray-600">
          Encontre uma célula para participar e crescer em comunidade
        </p>
      </div>

      {profile?.cell_id && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-8">
          <p className="font-semibold">
            Você já faz parte de uma célula!
          </p>
          <p className="text-sm text-green-700 mt-1">
            Você pode visualizar as outras células disponíveis, mas só pode participar de uma célula por vez.
          </p>
        </div>
      )}

      {cellsWithCounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-16 text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nenhuma célula disponível</p>
          <p className="text-gray-500 text-sm">
            Entre em contato com a liderança para mais informações
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cellsWithCounts.map((cell) => {
            const leader = Array.isArray(cell.leader) ? cell.leader[0] : cell.leader
            const isUserInCell = profile?.cell_id === cell.id
            const hasPendingRequest = pendingCellIds.has(cell.id)

            return (
              <div
                key={cell.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{cell.name}</h3>
                  {leader && (
                    <p className="text-sm opacity-90">
                      Líder: {leader.full_name}
                    </p>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {cell.description && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {cell.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {cell.day_of_week !== null && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {DAYS[cell.day_of_week]}
                          {cell.meeting_time && ` às ${cell.meeting_time.slice(0, 5)}`}
                        </span>
                      </div>
                    )}

                    {cell.neighborhood && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{cell.neighborhood}</span>
                      </div>
                    )}

                    {cell.address && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-4 h-4 invisible" />
                        <span>{cell.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{cell.membersCount} membros</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    {isUserInCell ? (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center text-sm font-semibold">
                        Você participa desta célula
                      </div>
                    ) : hasPendingRequest ? (
                      <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-center text-sm font-semibold">
                        Solicitação Pendente
                      </div>
                    ) : profile?.cell_id ? (
                      <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-center text-sm">
                        Você já participa de outra célula
                      </div>
                    ) : (
                      <RequestCellMembershipButton
                        cellId={cell.id}
                        cellName={cell.name}
                        isAlreadyMember={!!profile?.cell_id}
                        hasPendingRequest={hasPendingRequest}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
