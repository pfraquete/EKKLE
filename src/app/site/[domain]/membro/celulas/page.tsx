import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Home, MapPin, Clock, Users, CheckCircle2, Sparkles } from 'lucide-react'
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
  console.log('Fetching cells for church slug/id:', church.slug, church.id)

  const { data: cells, error } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      day_of_week,
      meeting_time,
      address,
      neighborhood,
      leader:profiles!leader_id(
        id,
        full_name
      )
    `)
    .eq('church_id', church.id)
    .eq('status', 'ACTIVE')
    .order('name')

  if (error) {
    console.error('CELULAS FETCH ERROR:', error)
  } else {
    console.log('CELULAS FETCH SUCCESS:', cells?.length)
  }

  // Get member counts for each cell
  const cellsWithCounts = await Promise.all(
    (cells || []).map(async (cell) => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('cell_id', cell.id)

      return {
        ...cell,
        membersCount: count || 0,
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
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter italic">Células Disponíveis</h1>
          <p className="text-muted-foreground font-medium mt-2">
            Encontre o seu lugar para pertencer, crescer e servir em comunidade.
          </p>
        </div>

        {profile?.cell_id && (
          <div className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-xs font-black uppercase tracking-widest text-primary">
              Membro Ativo de Célula
            </p>
          </div>
        )}
      </div>

      {cellsWithCounts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-[3rem] p-24 text-center">
          <div className="bg-muted w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Home className="w-12 h-12 text-muted-foreground/30" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight italic">Nenhuma célula encontrada</h2>
          <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Nós valorizamos a vida em comunidade. Entre em contato com nossa recepção para descobrir novas turmas em formação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cellsWithCounts.map((cell) => {
            const leader = Array.isArray(cell.leader) ? cell.leader[0] : cell.leader
            const isUserInCell = profile?.cell_id === cell.id
            const hasPendingRequest = pendingCellIds.has(cell.id)

            return (
              <div
                key={cell.id}
                className="group bg-card border border-border/40 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full"
              >
                {/* Header Card */}
                <div className="bg-gradient-to-br from-primary to-primary/60 p-10 text-primary-foreground relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black tracking-tighter mb-2 italic drop-shadow-md">{cell.name}</h3>
                    {leader && (
                      <div className="flex items-center gap-2 opacity-90 text-xs font-black uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5" />
                        <span>Líder {leader.full_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                </div>

                <div className="p-10 space-y-8 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {cell.day_of_week !== null && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center group-hover/item:border-primary/30 transition-colors">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">Encontro</p>
                          <p className="text-sm font-bold text-foreground">
                            {DAYS[cell.day_of_week]}
                            {cell.meeting_time && ` às ${cell.meeting_time.slice(0, 5)}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {(cell.neighborhood || cell.address) && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center group-hover/item:border-primary/30 transition-colors">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">Localização</p>
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {cell.neighborhood || 'Endereço Disponível'}
                          </p>
                          {cell.address && (
                            <p className="text-[11px] text-muted-foreground font-medium mt-1">
                              {cell.address}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center group-hover/item:border-primary/30 transition-colors">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">Membros</p>
                        <p className="text-sm font-bold text-foreground">{cell.membersCount} Pessoas</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 mt-auto border-t border-border/40">
                    {isUserInCell ? (
                      <Link
                        href="/membro/minha-celula"
                        className="flex flex-col items-center bg-primary text-primary-foreground border border-primary/20 px-4 py-6 rounded-2xl text-center text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                      >
                        <Sparkles className="w-5 h-5 mx-auto mb-3 animate-pulse" />
                        Acessar Painel da Minha Célula
                      </Link>
                    ) : hasPendingRequest ? (
                      <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
                        <Clock className="w-4 h-4 mx-auto mb-2" />
                        Solicitação em Análise
                      </div>
                    ) : profile?.cell_id ? (
                      <div className="bg-muted px-4 py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60 border border-border/50">
                        Indisponível (Já vinculado)
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
