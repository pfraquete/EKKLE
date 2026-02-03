// =====================================================
// SITE SETTINGS TYPES
// Tipos para configurações completas do site público
// =====================================================

export interface SiteTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: 'Inter' | 'Poppins' | 'Montserrat' | 'Playfair Display' | 'Roboto'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export interface SiteHeader {
  logoPosition: 'left' | 'center'
  menuStyle: 'default' | 'minimal' | 'expanded'
  showSocialLinks: boolean
  transparent: boolean
  sticky: boolean
}

export interface SiteFooter {
  enabled: boolean
  showAddress: boolean
  showSocialLinks: boolean
  showCopyright: boolean
  customText: string
  backgroundColor: string
}

export interface SiteHero {
  enabled: boolean
  title: string
  subtitle: string
  backgroundUrl: string
  backgroundOverlay: number // 0-100 opacity
  textAlign: 'left' | 'center' | 'right'
  minHeight: 'small' | 'medium' | 'large' | 'full'
  cta: {
    enabled: boolean
    text: string
    link: string
    style: 'primary' | 'secondary' | 'outline'
  }
  secondaryCta?: {
    enabled: boolean
    text: string
    link: string
  }
}

export interface SectionConfig {
  enabled: boolean
  order: number
  title: string
  subtitle: string
}

export interface CellsSectionConfig extends SectionConfig {
  showAddress: boolean
  showLeader: boolean
  showSchedule: boolean
  showNeighborhood: boolean
  layout: 'grid' | 'list' | 'map'
  maxItems: number
}

export interface EventsSectionConfig extends SectionConfig {
  maxItems: number
  showPastEvents: boolean
}

export interface CoursesSectionConfig extends SectionConfig {
  maxItems: number
  showPrice: boolean
}

export interface AboutSectionConfig extends SectionConfig {
  showImage: boolean
  imageUrl: string
  buttonText: string
  buttonLink: string
}

export interface ContactSectionConfig extends SectionConfig {
  showForm: boolean
  showMap: boolean
  showPhone: boolean
  showEmail: boolean
  showAddress: boolean
  formFields: ('name' | 'email' | 'phone' | 'message')[]
}

export interface TestimonialsSectionConfig extends SectionConfig {
  autoPlay: boolean
  showPhoto: boolean
  maxItems: number
}

export interface SiteSections {
  hero: SiteHero
  cells: CellsSectionConfig
  events: EventsSectionConfig
  courses: CoursesSectionConfig
  about: AboutSectionConfig
  contact: ContactSectionConfig
  testimonials: TestimonialsSectionConfig
}

export interface SiteSEO {
  metaTitle: string
  metaDescription: string
  ogImage: string
  keywords: string[]
}

export interface WebsiteSettings {
  theme: SiteTheme
  header: SiteHeader
  footer: SiteFooter
  sections: SiteSections
  seo: SiteSEO
  customCss: string
}

// Default values
export const defaultSiteTheme: SiteTheme = {
  primaryColor: '#D4AF37',
  secondaryColor: '#1A1A1A',
  accentColor: '#F2D675',
  backgroundColor: '#0B0B0B',
  textColor: '#FFFFFF',
  fontFamily: 'Inter',
  borderRadius: 'lg',
}

export const defaultSiteHeader: SiteHeader = {
  logoPosition: 'left',
  menuStyle: 'default',
  showSocialLinks: true,
  transparent: true,
  sticky: true,
}

export const defaultSiteFooter: SiteFooter = {
  enabled: true,
  showAddress: true,
  showSocialLinks: true,
  showCopyright: true,
  customText: '',
  backgroundColor: '#0F0F0F',
}

export const defaultSiteHero: SiteHero = {
  enabled: true,
  title: '',
  subtitle: '',
  backgroundUrl: '',
  backgroundOverlay: 40,
  textAlign: 'center',
  minHeight: 'large',
  cta: {
    enabled: true,
    text: 'Saiba Mais',
    link: '/sobre',
    style: 'primary',
  },
}

export const defaultCellsSection: CellsSectionConfig = {
  enabled: true,
  order: 2,
  title: 'Conheça nossas Células',
  subtitle: 'Encontre uma célula perto de você e faça parte de uma comunidade',
  showAddress: true,
  showLeader: true,
  showSchedule: true,
  showNeighborhood: true,
  layout: 'grid',
  maxItems: 12,
}

export const defaultEventsSection: EventsSectionConfig = {
  enabled: true,
  order: 1,
  title: 'Próximos Eventos',
  subtitle: 'Participe das nossas atividades e fortaleça sua comunhão',
  maxItems: 3,
  showPastEvents: false,
}

export const defaultCoursesSection: CoursesSectionConfig = {
  enabled: true,
  order: 3,
  title: 'Escola de Líderes',
  subtitle: 'Conteúdos exclusivos para seu crescimento espiritual',
  maxItems: 3,
  showPrice: true,
}

export const defaultAboutSection: AboutSectionConfig = {
  enabled: true,
  order: 4,
  title: 'Sobre Nós',
  subtitle: '',
  showImage: false,
  imageUrl: '',
  buttonText: 'Conheça Nossa História',
  buttonLink: '/sobre',
}

export const defaultContactSection: ContactSectionConfig = {
  enabled: true,
  order: 5,
  title: 'Entre em Contato',
  subtitle: 'Estamos aqui para ajudar você',
  showForm: true,
  showMap: true,
  showPhone: true,
  showEmail: true,
  showAddress: true,
  formFields: ['name', 'email', 'phone', 'message'],
}

export const defaultTestimonialsSection: TestimonialsSectionConfig = {
  enabled: false,
  order: 6,
  title: 'Testemunhos',
  subtitle: 'Veja o que nossa comunidade diz',
  autoPlay: true,
  showPhoto: true,
  maxItems: 6,
}

export const defaultSiteSEO: SiteSEO = {
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  keywords: [],
}

export const defaultWebsiteSettings: WebsiteSettings = {
  theme: defaultSiteTheme,
  header: defaultSiteHeader,
  footer: defaultSiteFooter,
  sections: {
    hero: defaultSiteHero,
    cells: defaultCellsSection,
    events: defaultEventsSection,
    courses: defaultCoursesSection,
    about: defaultAboutSection,
    contact: defaultContactSection,
    testimonials: defaultTestimonialsSection,
  },
  seo: defaultSiteSEO,
  customCss: '',
}

// Helper to merge partial settings with defaults
export function mergeWithDefaults(partial: Partial<WebsiteSettings>): WebsiteSettings {
  return {
    theme: { ...defaultSiteTheme, ...partial.theme },
    header: { ...defaultSiteHeader, ...partial.header },
    footer: { ...defaultSiteFooter, ...partial.footer },
    sections: {
      hero: { ...defaultSiteHero, ...partial.sections?.hero },
      cells: { ...defaultCellsSection, ...partial.sections?.cells },
      events: { ...defaultEventsSection, ...partial.sections?.events },
      courses: { ...defaultCoursesSection, ...partial.sections?.courses },
      about: { ...defaultAboutSection, ...partial.sections?.about },
      contact: { ...defaultContactSection, ...partial.sections?.contact },
      testimonials: { ...defaultTestimonialsSection, ...partial.sections?.testimonials },
    },
    seo: { ...defaultSiteSEO, ...partial.seo },
    customCss: partial.customCss || '',
  }
}
