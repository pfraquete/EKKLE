import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChurchSiteConfigForm } from '@/components/config/church-site-config-form'

export default async function SiteConfigPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Only PASTOR can access
  if (profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Get church data
  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('id', profile.church_id)
    .single()

  if (!church) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="font-bold text-red-800 mb-2">Erro</h2>
          <p className="text-red-600">Igreja não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações do Site</h1>
        <p className="text-muted-foreground mt-2">
          Configure as informações públicas do site da sua igreja
        </p>
      </div>

      <ChurchSiteConfigForm church={church} />
    </div>
  )
}
