import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Palette, Layout, ArrowRight } from 'lucide-react'
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
        <h1 className="text-3xl font-bold text-foreground">Configurações do Site</h1>
        <p className="text-muted-foreground mt-2">
          Configure as informações públicas do site da sua igreja
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branding */}
        <Link
          href="/configuracoes/site/branding"
          className="block bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-foreground">
                  Identidade Visual
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cores, fontes, logo e elementos visuais
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          </div>
        </Link>

        {/* Homepage */}
        <Link
          href="/configuracoes/site/homepage"
          className="block bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Layout className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-foreground">
                  Página Inicial
                </h3>
                <p className="text-sm text-muted-foreground">
                  Hero, seções e layout da homepage
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
          </div>
        </Link>
      </div>

      <ChurchSiteConfigForm church={church} />
    </div>
  )
}
