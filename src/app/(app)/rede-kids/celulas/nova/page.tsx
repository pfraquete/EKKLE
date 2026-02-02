import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getAvailableKidsLeaders, AvailableKidsLeader } from '@/actions/kids-cells'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateCellForm } from './create-cell-form'

export default async function NovaCelulaKidsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  const isPastor = profile.role === 'PASTOR'
  const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'

  if (!isPastor && !isPastoraKids) {
    redirect('/rede-kids/celulas')
  }

  const availableLeaders = await getAvailableKidsLeaders()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/rede-kids/celulas"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Célula Kids</h1>
          <p className="text-muted-foreground">
            Crie uma nova célula para a Rede Kids
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-xl p-6">
        <CreateCellForm availableLeaders={availableLeaders} />
      </div>
    </div>
  )
}
