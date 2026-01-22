/**
 * Branding utilities for applying custom church theme
 */

import { BrandingSettings } from '@/actions/branding'

/**
 * Generate CSS variables from branding settings
 */
export function generateThemeCSS(settings: BrandingSettings): string {
  const colors = settings.colors || {}
  const fonts = settings.fonts || {}

  // Convert hex to RGB for Tailwind opacity utilities
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : '0 0 0'
  }

  const css = `
    :root {
      /* Colors */
      --color-primary: ${colors.primary || '#4F46E5'};
      --color-primary-rgb: ${hexToRgb(colors.primary || '#4F46E5')};
      --color-secondary: ${colors.secondary || '#10B981'};
      --color-secondary-rgb: ${hexToRgb(colors.secondary || '#10B981')};
      --color-accent: ${colors.accent || '#F59E0B'};
      --color-accent-rgb: ${hexToRgb(colors.accent || '#F59E0B')};

      /* Fonts */
      --font-heading: ${fonts.heading || 'Inter'}, sans-serif;
      --font-body: ${fonts.body || 'Inter'}, sans-serif;
    }

    /* Apply custom colors to Tailwind utilities */
    .bg-primary { background-color: var(--color-primary); }
    .text-primary { color: var(--color-primary); }
    .border-primary { border-color: var(--color-primary); }

    .bg-secondary { background-color: var(--color-secondary); }
    .text-secondary { color: var(--color-secondary); }
    .border-secondary { border-color: var(--color-secondary); }

    .bg-accent { background-color: var(--color-accent); }
    .text-accent { color: var(--color-accent); }
    .border-accent { border-color: var(--color-accent); }

    /* Apply opacity variants */
    .bg-primary\/10 { background-color: rgba(var(--color-primary-rgb), 0.1); }
    .bg-primary\/20 { background-color: rgba(var(--color-primary-rgb), 0.2); }
    .bg-primary\/50 { background-color: rgba(var(--color-primary-rgb), 0.5); }

    .text-primary\/70 { color: rgba(var(--color-primary-rgb), 0.7); }
    .text-primary\/80 { color: rgba(var(--color-primary-rgb), 0.8); }
    .text-primary\/90 { color: rgba(var(--color-primary-rgb), 0.9); }

    /* Apply fonts */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }

    body {
      font-family: var(--font-body);
    }
  `

  return css
}

/**
 * Get Google Fonts import URL for the selected fonts
 */
export function getGoogleFontsURL(settings: BrandingSettings): string {
  const fonts = settings.fonts || {}
  const fontFamilies = new Set<string>()

  if (fonts.heading) fontFamilies.add(fonts.heading)
  if (fonts.body) fontFamilies.add(fonts.body)

  if (fontFamilies.size === 0) {
    return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
  }

  // Build Google Fonts URL
  const fontParams = Array.from(fontFamilies)
    .map((font) => {
      // Replace spaces with +
      const fontName = font.replace(/\s+/g, '+')
      return `family=${fontName}:wght@300;400;500;600;700;800;900`
    })
    .join('&')

  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`
}

/**
 * Generate meta tags for favicon
 */
export function generateFaviconMeta(faviconUrl?: string): string {
  if (!faviconUrl) return ''

  return `
    <link rel="icon" type="image/png" href="${faviconUrl}" />
    <link rel="shortcut icon" href="${faviconUrl}" />
  `
}
