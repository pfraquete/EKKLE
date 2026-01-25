import { BrandingSettings } from '@/actions/branding'
import { generateThemeCSS, getGoogleFontsURL } from '@/lib/branding'

/**
 * Validate favicon URL - only allow HTTPS or relative paths
 * SECURITY: Prevents injection of malicious protocols (javascript:, data:, etc.)
 */
function isValidFaviconUrl(url: string | undefined): boolean {
  if (!url) return false
  // Allow relative paths starting with /
  if (url.startsWith('/')) return true
  // Only allow HTTPS URLs
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

interface ThemeProviderProps {
  settings?: BrandingSettings
  children?: React.ReactNode
}

/**
 * ThemeProvider component that injects custom CSS and fonts
 * Used in public church sites to apply custom branding
 */
export function ThemeProvider({ settings, children }: ThemeProviderProps) {
  if (!settings) {
    return <>{children}</>
  }

  const themeCSS = generateThemeCSS(settings)
  const fontsURL = getGoogleFontsURL(settings)

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link href={fontsURL} rel="stylesheet" />

      {/* Favicon - Only render if URL is valid (HTTPS or relative path) */}
      {isValidFaviconUrl(settings.logo?.favicon_url) && (
        <>
          <link rel="icon" type="image/png" href={settings.logo!.favicon_url!} />
          <link rel="shortcut icon" href={settings.logo!.favicon_url!} />
        </>
      )}

      {/* Custom Theme CSS */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* Theme Class Wrapper */}
      <div className={settings.theme?.mode ? `theme-${settings.theme.mode}` : ''}>
        {children}
      </div>
    </>
  )
}
