import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, MessageCircle, AlertTriangle, MapPin, Phone, Mail, Heart } from 'lucide-react'
import { SiteHeader } from '@/components/site/site-header'
import { createClient } from '@/lib/supabase/server'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'
import { mergeWithDefaults, WebsiteSettings } from '@/types/site-settings'

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Site Temporariamente Indisponível
            </h1>
            <p className="text-gray-400">
              Este site está temporariamente fora do ar. Por favor, entre em contato com a administração da igreja para mais informações.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold text-[#D4AF37]">Ekkle</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Parse website settings
  const rawSettings = church.website_settings as Partial<WebsiteSettings> | null
  const settings = mergeWithDefaults(rawSettings || {})
  const { theme, footer } = settings

  // Generate CSS variables from theme
  const themeStyles = {
    '--site-primary': theme.primaryColor,
    '--site-secondary': theme.secondaryColor,
    '--site-accent': theme.accentColor,
    '--site-bg': theme.backgroundColor,
    '--site-text': theme.textColor,
  } as React.CSSProperties

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        ...themeStyles,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* Header */}
      <SiteHeader church={church} settings={settings} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer - Modern Church Style */}
      {footer.enabled && (
        <footer 
          className="border-t border-white/10 pt-16 pb-8"
          style={{ backgroundColor: footer.backgroundColor || theme.secondaryColor }}
        >
          <div className="container mx-auto px-6">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Church Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-4">
                  {church.logo_url && (
                    <Image
                      src={church.logo_url}
                      alt={church.name}
                      width={56}
                      height={56}
                      className="rounded-xl"
                    />
                  )}
                  <h3 className="text-2xl font-bold" style={{ color: theme.textColor }}>
                    {church.name}
                  </h3>
                </div>
                {church.description && (
                  <p className="text-lg leading-relaxed opacity-70" style={{ color: theme.textColor }}>
                    {church.description}
                  </p>
                )}
                
                {/* Social Links */}
                {footer.showSocialLinks && (
                  <div className="flex gap-3 pt-4">
                    {church.instagram_url && (
                      <a
                        href={church.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        style={{ 
                          backgroundColor: `${theme.primaryColor}20`,
                          color: theme.primaryColor,
                        }}
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {church.youtube_channel_url && (
                      <a
                        href={church.youtube_channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        style={{ 
                          backgroundColor: `${theme.primaryColor}20`,
                          color: theme.primaryColor,
                        }}
                      >
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                    {church.whatsapp_url && (
                      <a
                        href={church.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        style={{ 
                          backgroundColor: `${theme.primaryColor}20`,
                          color: theme.primaryColor,
                        }}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div>
                <h4 
                  className="text-sm font-bold uppercase tracking-wider mb-6"
                  style={{ color: theme.primaryColor }}
                >
                  Navegação
                </h4>
                <ul className="space-y-3">
                  {[
                    { href: '/', label: 'Início' },
                    { href: '/sobre', label: 'Sobre Nós' },
                    { href: '/eventos', label: 'Eventos' },
                    { href: '/cursos', label: 'Cursos' },
                    { href: '/cultos', label: 'Cultos Online' },
                    { href: '/lives', label: 'Lives' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: theme.textColor }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              {footer.showAddress && (
                <div>
                  <h4 
                    className="text-sm font-bold uppercase tracking-wider mb-6"
                    style={{ color: theme.primaryColor }}
                  >
                    Contato
                  </h4>
                  <ul className="space-y-4">
                    {church.address && (
                      <li className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.primaryColor }} />
                        <span className="opacity-70" style={{ color: theme.textColor }}>
                          {church.address}
                        </span>
                      </li>
                    )}
                    {church.city && church.state && (
                      <li className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-0" />
                        <span className="opacity-70" style={{ color: theme.textColor }}>
                          {church.city}, {church.state}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Custom Footer Text */}
            {footer.customText && (
              <div 
                className="text-center py-6 border-t border-white/10 mb-6"
                style={{ color: theme.textColor }}
              >
                <p className="opacity-70">{footer.customText}</p>
              </div>
            )}

            {/* Copyright */}
            {footer.showCopyright && (
              <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm opacity-50" style={{ color: theme.textColor }}>
                  © {new Date().getFullYear()} {church.name}. Todos os direitos reservados.
                </p>
                <p className="text-sm flex items-center gap-2 opacity-50" style={{ color: theme.textColor }}>
                  Feito com <Heart className="w-4 h-4" style={{ color: theme.primaryColor }} /> por{' '}
                  <a 
                    href="https://ekkle.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:opacity-100 transition-opacity"
                    style={{ color: theme.primaryColor }}
                  >
                    Ekkle
                  </a>
                </p>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
