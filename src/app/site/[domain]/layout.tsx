import { getChurch } from '@/lib/get-church'
import { redirect } from 'next/navigation'
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
    <ThemeProvider settings={brandingSettings}>
      {children}
    </ThemeProvider>
  )
}
