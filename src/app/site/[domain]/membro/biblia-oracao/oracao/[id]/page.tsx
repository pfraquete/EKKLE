import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { getPrayerDetail } from '@/actions/prayers'
import { PrayerItemsList, BlessingToggle, SuggestedVerses } from '@/components/prayers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeletePrayerButton } from './delete-button'
import { RefreshButton } from './refresh-button'

interface Props {
  params: Promise<{ domain: string; id: string }>
}

export default async function PrayerDetailPage({ params }: Props) {
  const { id: prayerId } = await params
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

  // Get prayer detail
  const result = await getPrayerDetail(prayerId)

  if (!result.success || !result.prayer) {
    notFound()
  }

  const { prayer, items } = result

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isProcessing = prayer.transcription_status === 'PROCESSING'
  const isFailed = prayer.transcription_status === 'FAILED'
  const isCompleted = prayer.transcription_status === 'COMPLETED'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/membro/biblia-oracao/oracao"
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">
              Detalhes da Oracao
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(prayer.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(prayer.audio_duration_seconds)}
              </span>
            </div>
          </div>
        </div>

        <DeletePrayerButton prayerId={prayer.id} />
      </div>

      {/* Processing State */}
      {isProcessing && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
            <h3 className="font-bold text-foreground mb-1">Transcrevendo sua oracao...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A IA esta processando o audio. Isso pode levar alguns minutos.
            </p>
            <RefreshButton />
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-destructive mb-1">Erro na transcricao</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Houve um problema ao transcrever sua oracao. Tente gravar novamente.
            </p>
            <Link href="/membro/biblia-oracao/oracao/nova">
              <Button variant="outline">Gravar Nova Oracao</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {prayer.ai_summary && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{prayer.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      {prayer.transcription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Transcricao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {prayer.transcription}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prayer Items */}
      {isCompleted && items && items.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Pontos Extraidos
          </h2>
          <PrayerItemsList items={items} />
        </section>
      )}

      {/* Suggested Verses */}
      {prayer.suggested_verses && prayer.suggested_verses.length > 0 && (
        <SuggestedVerses verses={prayer.suggested_verses} />
      )}

      {/* Blessing Toggle */}
      {isCompleted && (
        <section className="pt-4">
          <BlessingToggle
            prayerId={prayer.id}
            isBlessed={prayer.blessing_received}
            blessedAt={prayer.blessing_received_at}
            blessedNotes={prayer.blessing_notes}
          />
        </section>
      )}
    </div>
  )
}
