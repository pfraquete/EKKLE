import { getProfile } from '@/actions/auth'
import { getLiveStream } from '@/actions/live-streams'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditLiveStreamForm } from '@/components/live/edit-live-stream-form'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditarLivePage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR') redirect('/dashboard')

  const stream = await getLiveStream(id)
  if (!stream) notFound()

  // Only allow editing scheduled or ended streams
  if (stream.status === 'LIVE') {
    redirect(`/dashboard/lives/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/lives/${id}`}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Transmissão</h1>
          <p className="text-muted-foreground mt-2">
            Atualize as informações da sua transmissão
          </p>
        </div>
      </div>

      <EditLiveStreamForm stream={stream} />
    </div>
  )
}
