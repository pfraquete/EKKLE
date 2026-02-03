import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChurchSiteConfigForm } from '@/components/config/church-site-config-form'

export default async function GeneralConfigPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('id', profile.church_id)
    .single()

  if (!church) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <p className="text-destructive font-semibold">Igreja não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/configuracoes/site">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white-primary flex items-center gap-3">
            <Settings2 className="w-7 h-7 text-gray-400" />
            Configurações Gerais
          </h1>
          <p className="text-gray-text-secondary">
            Informações básicas, slug, endereço e redes sociais
          </p>
        </div>
      </div>

      <ChurchSiteConfigForm key={church.updated_at || church.id} church={church} />
    </div>
  )
}
