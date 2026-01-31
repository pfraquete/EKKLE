import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Instagram, Youtube, MessageCircle, AlertTriangle } from 'lucide-react'
import { BrandingSettings } from '@/actions/branding'
import { SiteHeader } from '@/components/site/site-header'
import { createClient } from '@/lib/supabase/server'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

export default async function SitePublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const church = await getChurch()

  if (!church) {
    redirect('/dashboard')
  }

  // Check subscription status for non-Ekkle Hub churches
  let isSubscriptionExpired = false
  if (church.id !== EKKLE_HUB_ID) {
    const supabase = await createClient()
    const { data: subStatus } = await supabase
      .rpc('check_church_subscription_status', { p_church_id: church.id })
      .single()

    const status = subStatus as { is_active: boolean } | null
    isSubscriptionExpired = status ? !status.is_active : false
  }

  // If subscription expired, show message instead of site content
  if (isSubscriptionExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Site Temporariamente Indisponivel
            </h1>
            <p className="text-gray-600">
              Este site esta temporariamente fora do ar. Por favor, entre em contato com a administracao da igreja para mais informacoes.
            </p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold">Ekkle</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Parse branding settings from website_settings JSONB
  const brandingSettings = (church.website_settings || {}) as BrandingSettings

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <SiteHeader church={church} branding={brandingSettings} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Church Info */}
            <div>
              <h3 className="font-bold text-lg mb-4">{church.name}</h3>
              {church.description && (
                <p className="text-gray-600 text-sm mb-4">{church.description}</p>
              )}
              {church.address && (
                <p className="text-gray-600 text-sm">{church.address}</p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-primary">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/sobre" className="text-gray-600 hover:text-primary">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/eventos" className="text-gray-600 hover:text-primary">
                    Eventos
                  </Link>
                </li>
                <li>
                  <Link href="/cursos" className="text-gray-600 hover:text-primary">
                    Cursos
                  </Link>
                </li>
                <li>
                  <Link href="/cultos" className="text-gray-600 hover:text-primary">
                    Cultos Online
                  </Link>
                </li>
                <li>
                  <Link href="/lives" className="text-gray-600 hover:text-primary">
                    Lives
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-bold text-lg mb-4">Redes Sociais</h3>
              <div className="flex gap-4">
                {church.instagram_url && (
                  <a
                    href={church.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {church.youtube_channel_url && (
                  <a
                    href={church.youtube_channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {church.whatsapp_url && (
                  <a
                    href={church.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>
              © {new Date().getFullYear()} {church.name}. Todos os direitos
              reservados.
            </p>
            <p className="mt-2">
              Powered by <span className="font-semibold">Ekkle</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
