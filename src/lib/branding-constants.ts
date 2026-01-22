/**
 * Branding constants and helper functions (not server actions)
 */

import { BrandingSettings } from '@/actions/branding'
import { HomepageSettings } from '@/actions/homepage'

/**
 * Get available font options
 */
export function getAvailableFonts() {
  return {
    heading: [
      { value: 'Inter', label: 'Inter (Moderno)' },
      { value: 'Poppins', label: 'Poppins (Elegante)' },
      { value: 'Montserrat', label: 'Montserrat (Profissional)' },
      { value: 'Roboto', label: 'Roboto (Limpo)' },
      { value: 'Open Sans', label: 'Open Sans (Amigável)' },
      { value: 'Lato', label: 'Lato (Versátil)' },
      { value: 'Playfair Display', label: 'Playfair Display (Clássico)' },
      { value: 'Merriweather', label: 'Merriweather (Tradicional)' },
    ],
    body: [
      { value: 'Inter', label: 'Inter (Moderno)' },
      { value: 'Open Sans', label: 'Open Sans (Legível)' },
      { value: 'Roboto', label: 'Roboto (Neutro)' },
      { value: 'Lato', label: 'Lato (Suave)' },
      { value: 'Source Sans Pro', label: 'Source Sans Pro (Profissional)' },
      { value: 'Nunito', label: 'Nunito (Amigável)' },
      { value: 'PT Sans', label: 'PT Sans (Limpo)' },
      { value: 'Raleway', label: 'Raleway (Elegante)' },
    ],
  }
}

/**
 * Get default branding settings
 */
export function getDefaultBrandingSettings(): BrandingSettings {
  return {
    colors: {
      primary: '#e11d48', // Rose-600
      secondary: '#111827', // Gray-900
      accent: '#f43f5e', // Rose-500
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    logo: {
      url: undefined,
      favicon_url: undefined,
    },
    theme: {
      mode: 'light',
      borderRadius: 'lg',
      navStyle: 'blur',
    }
  }
}

/**
 * Get available theme options
 */
export function getAvailableThemeOptions() {
  return {
    modes: [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Escuro' },
      { value: 'glass', label: 'Glassmorphism' },
    ],
    radius: [
      { value: 'none', label: 'Reto' },
      { value: 'sm', label: 'Suave (SM)' },
      { value: 'md', label: 'Médio (MD)' },
      { value: 'lg', label: 'Arredondado (LG)' },
      { value: 'full', label: 'Cápsula' },
    ],
    navStyles: [
      { value: 'transparent', label: 'Transparente' },
      { value: 'solid', label: 'Sólido' },
      { value: 'blur', label: 'Efeito Translúcido' },
    ]
  }
}

/**
 * Get default homepage settings
 */
export function getDefaultHomepageSettings(): HomepageSettings {
  return {
    hero: {
      enabled: true,
      title: 'Bem-vindo à Nossa Igreja',
      subtitle: 'Venha fazer parte da nossa comunidade de fé',
      backgroundUrl: undefined,
      cta: {
        text: 'Conheça Mais',
        link: '/sobre',
      },
    },
    sections: {
      events: { enabled: true, order: 1 },
      courses: { enabled: true, order: 2 },
      store: { enabled: true, order: 3 },
      about: { enabled: true, order: 4 },
    },
  }
}

/**
 * Get available sections
 */
export function getAvailableSections() {
  return [
    {
      id: 'events',
      name: 'Eventos',
      description: 'Próximos eventos e atividades da igreja',
      icon: 'Calendar',
    },
    {
      id: 'courses',
      name: 'Cursos',
      description: 'Cursos e estudos bíblicos disponíveis',
      icon: 'BookOpen',
    },
    {
      id: 'store',
      name: 'Loja',
      description: 'Produtos e materiais disponíveis',
      icon: 'ShoppingBag',
    },
    {
      id: 'about',
      name: 'Sobre Nós',
      description: 'Informações sobre a igreja',
      icon: 'Info',
    },
  ] as const
}
