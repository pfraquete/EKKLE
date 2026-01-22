import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, MessageCircle } from 'lucide-react'
import { ThemeProvider } from '@/components/branding/theme-provider'
import { BrandingSettings } from '@/actions/branding'

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const church = await getChurch()

  if (!church) {
    redirect('/dashboard')
  }

  // Parse branding settings from website_settings JSONB
  const brandingSettings = (church.website_settings || {}) as BrandingSettings

  return (
    <>
      <ThemeProvider settings={brandingSettings} />
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Church Name */}
            <Link href="/" className="flex items-center gap-3">
              {church.logo_url ? (
                <Image
                  src={church.logo_url}
                  alt={church.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {church.name[0]}
                </div>
              )}
              <span className="text-xl font-bold">{church.name}</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="hover:text-primary transition-colors">
                Início
              </Link>
              <Link href="/sobre" className="hover:text-primary transition-colors">
                Sobre
              </Link>
              <Link href="/eventos" className="hover:text-primary transition-colors">
                Eventos
              </Link>
              <Link href="/cursos" className="hover:text-primary transition-colors">
                Cursos
              </Link>
              <Link href="/cultos" className="hover:text-primary transition-colors">
                Cultos
              </Link>
              <Link
                href="/membro"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Área do Membro
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

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
    </>
  )
}
