import { BrandingSettings } from '@/actions/branding'
import { generateThemeCSS, getGoogleFontsURL } from '@/lib/branding'

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

      {/* Favicon */}
      {settings.logo?.favicon_url && (
        <>
          <link rel="icon" type="image/png" href={settings.logo.favicon_url} />
          <link rel="shortcut icon" href={settings.logo.favicon_url} />
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
