import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPersonalGoals } from '@/actions/personal-goals'
import { GoalsSection } from '@/components/personal-goals'

export default async function EkkleAlvosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const goalsResult = await getPersonalGoals()
  const goals = goalsResult.success ? goalsResult.goals : []

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href="/ekkle/membro/biblia-oracao"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <GoalsSection initialGoals={goals} />
    </div>
  )
}
