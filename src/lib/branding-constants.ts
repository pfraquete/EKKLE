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
      primary: '#4F46E5', // Indigo-600
      secondary: '#10B981', // Green-500
      accent: '#F59E0B', // Amber-500
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    logo: {
      url: undefined,
      favicon_url: undefined,
    },
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
