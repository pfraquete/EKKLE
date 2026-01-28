import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { NewLiveStreamForm } from '@/components/live/new-live-stream-form'

export const dynamic = 'force-dynamic'

export default async function NovaLivePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR') redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Transmissao</h1>
        <p className="text-muted-foreground mt-2">
          Configure sua nova transmissao ao vivo
        </p>
      </div>

      <NewLiveStreamForm />
    </div>
  )
}
