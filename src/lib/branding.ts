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
  const theme = settings.theme || {}

  // Convert hex to RGB for Tailwind opacity utilities
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : '0 0 0'
  }

  const getRadius = (r?: string) => {
    switch (r) {
      case 'none': return '0'
      case 'sm': return '4px'
      case 'md': return '8px'
      case 'lg': return '12px'
      case 'full': return '9999px'
      default: return '12px'
    }
  }

  const css = `
    :root {
      /* Colors */
      --color-primary: ${colors.primary || '#e11d48'};
      --color-primary-rgb: ${hexToRgb(colors.primary || '#e11d48')};
      --color-secondary: ${colors.secondary || '#111827'};
      --color-secondary-rgb: ${hexToRgb(colors.secondary || '#111827')};
      --color-accent: ${colors.accent || '#f43f5e'};
      --color-accent-rgb: ${hexToRgb(colors.accent || '#f43f5e')};

      /* Fonts */
      --font-heading: "${fonts.heading || 'Inter'}", sans-serif;
      --font-body: "${fonts.body || 'Inter'}", sans-serif;

      /* Theme Tokens */
      --radius-custom: ${getRadius(theme.borderRadius)};
    }

    /* Theme Modes Overlay (Applied via class on a wrapper) */
    .theme-dark {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 10% 6%;
      --border: 240 3.7% 15.9%;
    }

    .theme-glass {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
    }

    /* Base Component Overrides */
    .btn-custom, button:not([class*="bg-transparent"]) {
      border-radius: var(--radius-custom) !important;
    }

    .card-custom, [class*="rounded-"] {
      border-radius: var(--radius-custom) !important;
    }

    /* Apply custom colors to Tailwind utilities */
    .bg-primary { background-color: var(--color-primary); }
    .text-primary { color: var(--color-primary); }
    .border-primary { border-color: var(--color-primary); }

    .bg-secondary { background-color: var(--color-secondary); }
    .text-secondary { color: var(--color-secondary); }
    .border-secondary { border-color: var(--color-secondary); }

    /* Apply opacity variants */
    .bg-primary\/10 { background-color: rgba(var(--color-primary-rgb), 0.1); }
    .bg-primary\/20 { background-color: rgba(var(--color-primary-rgb), 0.2); }
    .bg-primary\/50 { background-color: rgba(var(--color-primary-rgb), 0.5); }

    /* Apply fonts */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading) !important;
    }

    body, p, span, a, li {
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
