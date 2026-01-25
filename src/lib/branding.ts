/**
 * Branding utilities for applying custom church theme
 *
 * SECURITY: All user-provided colors and fonts are validated
 * to prevent CSS injection attacks
 */

import { BrandingSettings } from '@/actions/branding'

/**
 * Allowed font families (whitelist to prevent CSS injection)
 */
const ALLOWED_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Raleway',
  'Source Sans Pro',
  'Ubuntu',
  'Merriweather',
  'Playfair Display',
  'PT Sans',
  'Oswald',
  'Quicksand',
]

/**
 * Validate hex color format
 * Only allows #RRGGBB or #RGB format
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Validate font family against whitelist
 */
function isValidFont(font: string): boolean {
  return ALLOWED_FONTS.includes(font)
}

/**
 * Sanitize and validate color, returning default if invalid
 */
function sanitizeColor(color: string | undefined, defaultColor: string): string {
  if (!color) return defaultColor
  return isValidHexColor(color) ? color : defaultColor
}

/**
 * Sanitize and validate font, returning default if invalid
 */
function sanitizeFont(font: string | undefined, defaultFont: string): string {
  if (!font) return defaultFont
  return isValidFont(font) ? font : defaultFont
}

/**
 * Generate CSS variables from branding settings
 */
export function generateThemeCSS(settings: BrandingSettings): string {
  const colors = settings.colors || {}
  const fonts = settings.fonts || {}
  const theme = settings.theme || {}

  // Sanitize colors (validate hex format)
  const safePrimary = sanitizeColor(colors.primary, '#e11d48')
  const safeSecondary = sanitizeColor(colors.secondary, '#111827')
  const safeAccent = sanitizeColor(colors.accent, '#f43f5e')

  // Sanitize fonts (validate against whitelist)
  const safeHeadingFont = sanitizeFont(fonts.heading, 'Inter')
  const safeBodyFont = sanitizeFont(fonts.body, 'Inter')

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
      /* Colors (validated hex format) */
      --color-primary: ${safePrimary};
      --color-primary-rgb: ${hexToRgb(safePrimary)};
      --color-secondary: ${safeSecondary};
      --color-secondary-rgb: ${hexToRgb(safeSecondary)};
      --color-accent: ${safeAccent};
      --color-accent-rgb: ${hexToRgb(safeAccent)};

      /* Fonts (validated against whitelist) */
      --font-heading: "${safeHeadingFont}", sans-serif;
      --font-body: "${safeBodyFont}", sans-serif;

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
 * Only includes fonts from the whitelist
 */
export function getGoogleFontsURL(settings: BrandingSettings): string {
  const fonts = settings.fonts || {}
  const fontFamilies = new Set<string>()

  // Only add fonts that pass validation
  if (fonts.heading && isValidFont(fonts.heading)) fontFamilies.add(fonts.heading)
  if (fonts.body && isValidFont(fonts.body)) fontFamilies.add(fonts.body)

  if (fontFamilies.size === 0) {
    return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
  }

  // Build Google Fonts URL (fonts already validated)
  const fontParams = Array.from(fontFamilies)
    .map((font) => {
      // Replace spaces with + (safe since font is from whitelist)
      const fontName = font.replace(/\s+/g, '+')
      return `family=${fontName}:wght@300;400;500;600;700;800;900`
    })
    .join('&')

  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`
}

/**
 * Export allowed fonts for UI components
 */
export { ALLOWED_FONTS }

/**
 * Generate meta tags for favicon
 * SECURITY: URL is validated to prevent injection
 */
export function generateFaviconMeta(faviconUrl?: string): string {
  if (!faviconUrl) return ''

  // Validate URL format (only allow https URLs or relative paths)
  try {
    const url = new URL(faviconUrl, 'https://placeholder.com')
    // Only allow https protocol or relative paths
    if (url.protocol !== 'https:' && !faviconUrl.startsWith('/')) {
      console.warn('[Branding] Invalid favicon URL protocol, must be HTTPS')
      return ''
    }
  } catch {
    // If it's not a valid URL, only allow paths starting with /
    if (!faviconUrl.startsWith('/')) {
      console.warn('[Branding] Invalid favicon URL format')
      return ''
    }
  }

  // Escape any potential HTML in the URL
  const safeUrl = faviconUrl
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `
    <link rel="icon" type="image/png" href="${safeUrl}" />
    <link rel="shortcut icon" href="${safeUrl}" />
  `
}
