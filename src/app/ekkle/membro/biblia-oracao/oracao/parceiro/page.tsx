import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getWeeklyPartner,
  getPartnerPreferences,
  getPartnershipRequests
} from '@/actions/prayer-partners'
import { PartnerCard } from '@/components/prayers/partner-card'
import { NoPartnerCard } from '@/components/prayers/no-partner-card'
import { PrayerRequestForm } from '@/components/prayers/prayer-request-form'
import { PrayerRequestList } from '@/components/prayers/prayer-request-list'

export default async function EkklePrayerPartnerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get preferences and weekly partner
  const [prefsResult, partnerResult] = await Promise.all([
    getPartnerPreferences(),
    getWeeklyPartner()
  ])

  const preferences = prefsResult.preferences
  const partner = partnerResult.partner

  // Get requests if has partner
  let requests: Awaited<ReturnType<typeof getPartnershipRequests>>['requests'] = []
  if (partner) {
    const requestsResult = await getPartnershipRequests(partner.partnership_id)
    requests = requestsResult.requests || []
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ekkle/membro/biblia-oracao/oracao">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Parceiro de Oração
            </h1>
            <p className="text-sm text-muted-foreground">
              Orem um pelo outro esta semana
            </p>
          </div>
        </div>

        <Link href="/ekkle/membro/biblia-oracao/oracao/parceiro/historico">
          <Button variant="ghost" size="icon">
            <History className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Partner Card or No Partner */}
      {partner ? (
        <PartnerCard
          partnerName={partner.partner_name}
          partnerPhoto={partner.partner_photo}
          weekStart={partner.week_start}
          weekEnd={partner.week_end}
          isNew={partner.is_new}
        />
      ) : (
        <NoPartnerCard isOptedIn={preferences?.is_active ?? false} />
      )}

      {/* Prayer Requests Section */}
      {partner && (
        <>
          {/* New Request Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wider">
                Novo Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrayerRequestForm
                partnershipId={partner.partnership_id}
                partnerName={partner.partner_name}
              />
            </CardContent>
          </Card>

          {/* Requests List */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">
              Pedidos desta Semana
            </h2>
            <PrayerRequestList
              requests={requests || []}
              currentUserId={user.id}
            />
          </div>
        </>
      )}

      {/* Opt-out option if has preferences */}
      {preferences?.is_active && (
        <div className="text-center pt-4 border-t">
          <Link
            href="/ekkle/membro/biblia-oracao/oracao/parceiro/configuracoes"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Link>
        </div>
      )}
    </div>
  )
}
