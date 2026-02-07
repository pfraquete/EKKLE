import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, Plus } from 'lucide-react'
import { getPrayerHistory } from '@/actions/prayers'
import { PrayerHistoryItem } from '@/components/prayers'
import { Button } from '@/components/ui/button'

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function EkkleHistoricoOracaoPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const page = parseInt(pageParam || '1', 10)
  const limit = 20

  // Get prayer history
  const result = await getPrayerHistory(page, limit)
  const prayers = result.success ? result.prayers : []
  const totalPages = result.success && result.totalPages ? result.totalPages : 1
  const total = result.success && result.total ? result.total : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/ekkle/membro/biblia-oracao/oracao"
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Histórico de Orações
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {total} {total === 1 ? 'oração registrada' : 'orações registradas'}
            </p>
          </div>
        </div>

        <Link href="/ekkle/membro/biblia-oracao/oracao/nova">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
        </Link>
      </div>

      {/* Prayer List */}
      {prayers && prayers.length > 0 ? (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <PrayerHistoryItem
              key={prayer.id}
              prayer={prayer}
              href={`/ekkle/membro/biblia-oracao/oracao/${prayer.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
          <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Nenhuma oração ainda
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Comece a gravar suas orações para criar um diário espiritual
          </p>
          <Link href="/ekkle/membro/biblia-oracao/oracao/nova">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Gravar Primeira Oração
            </Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/ekkle/membro/biblia-oracao/oracao/historico?page=${page - 1}`}>
              <Button variant="outline" size="sm">
                Anterior
              </Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/ekkle/membro/biblia-oracao/oracao/historico?page=${page + 1}`}>
              <Button variant="outline" size="sm">
                Próxima
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
