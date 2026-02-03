'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, Layers, GripVertical, Eye, EyeOff, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getWebsiteSettings, updateSiteSections } from '@/actions/site-settings'
import { SiteSections, defaultCellsSection, defaultEventsSection, defaultCoursesSection, defaultAboutSection, defaultContactSection, defaultTestimonialsSection, defaultSiteHero } from '@/types/site-settings'

type SectionKey = 'hero' | 'events' | 'cells' | 'courses' | 'about' | 'contact' | 'testimonials'

interface SectionItem {
  key: SectionKey
  title: string
  description: string
  icon: string
  configLink?: string
}

const sectionsList: SectionItem[] = [
  {
    key: 'hero',
    title: 'Hero / Banner Principal',
    description: 'Seção de destaque com imagem de fundo e chamada para ação',
    icon: '🎯',
    configLink: '/configuracoes/site/hero',
  },
  {
    key: 'events',
    title: 'Próximos Eventos',
    description: 'Lista de eventos e programações da igreja',
    icon: '📅',
  },
  {
    key: 'cells',
    title: 'Conheça nossas Células',
    description: 'Mapa e lista de células com endereços e horários',
    icon: '🏠',
    configLink: '/configuracoes/site/celulas',
  },
  {
    key: 'courses',
    title: 'Escola de Líderes / Cursos',
    description: 'Cursos e trilhas de capacitação disponíveis',
    icon: '📚',
  },
  {
    key: 'about',
    title: 'Sobre a Igreja',
    description: 'História, missão e valores da igreja',
    icon: '⛪',
  },
  {
    key: 'contact',
    title: 'Contato',
    description: 'Formulário de contato e informações',
    icon: '📞',
  },
  {
    key: 'testimonials',
    title: 'Testemunhos',
    description: 'Depoimentos de membros da comunidade',
    icon: '💬',
  },
]

export default function SectionsConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sections, setSections] = useState<SiteSections>({
    hero: defaultSiteHero,
    cells: defaultCellsSection,
    events: defaultEventsSection,
    courses: defaultCoursesSection,
    about: defaultAboutSection,
    contact: defaultContactSection,
    testimonials: defaultTestimonialsSection,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await getWebsiteSettings()
    if (result.success && result.data) {
      setSections(result.data.sections)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    const result = await updateSiteSections(sections)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }))
  }

  const updateOrder = (key: SectionKey, newOrder: number) => {
    setSections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        order: newOrder,
      },
    }))
  }

  const getOrder = (key: SectionKey): number => {
    const section = sections[key]
    if ('order' in section && typeof section.order === 'number') {
      return section.order
    }
    // Hero doesn't have order, return 0
    return 0
  }

  const moveSection = (key: SectionKey, direction: 'up' | 'down') => {
    // Hero section doesn't have order property
    if (key === 'hero') return

    const currentOrder = getOrder(key)
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1

    // Find section with the target order (excluding hero)
    const otherKey = Object.keys(sections).find(
      (k) => k !== 'hero' && getOrder(k as SectionKey) === newOrder
    ) as SectionKey | undefined

    if (otherKey && otherKey !== 'hero') {
      setSections((prev) => ({
        ...prev,
        [key]: { ...prev[key], order: newOrder },
        [otherKey]: { ...prev[otherKey], order: currentOrder },
      }))
    }
  }

  // Sort sections by order (hero always first)
  const sortedSections = [...sectionsList].sort((a, b) => {
    if (a.key === 'hero') return -1
    if (b.key === 'hero') return 1
    return getOrder(a.key) - getOrder(b.key)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuracoes/site">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white-primary flex items-center gap-3">
              <Layers className="w-7 h-7 text-purple-500" />
              Seções do Site
            </h1>
            <p className="text-gray-text-secondary">
              Ative, desative e organize as seções do seu site
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-4 h-4" />
          ) : null}
          {saving ? 'Salvando...' : success ? 'Salvo!' : 'Salvar'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="pt-6">
          <p className="text-gray-text-secondary">
            <strong className="text-purple-400">Dica:</strong> Arraste as seções para reorganizar a ordem em que aparecem no site.
            Seções desativadas não serão exibidas para os visitantes.
          </p>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-3">
        {sortedSections.map((item, index) => {
          const section = sections[item.key]
          const isEnabled = section.enabled

          return (
            <Card
              key={item.key}
              className={`bg-black-surface border-gray-border transition-all ${
                !isEnabled ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(item.key, 'up')}
                      disabled={index === 0}
                    >
                      <span className="text-xs">▲</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(item.key, 'down')}
                      disabled={index === sortedSections.length - 1}
                    >
                      <span className="text-xs">▼</span>
                    </Button>
                  </div>

                  {/* Icon */}
                  <div className="text-3xl">{item.icon}</div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white-primary flex items-center gap-2">
                      {item.title}
                      {!isEnabled && (
                        <span className="text-xs bg-gray-border px-2 py-0.5 rounded text-gray-text-muted">
                          Oculto
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-text-secondary">{item.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    {item.configLink && (
                      <Link href={item.configLink}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Settings2 className="w-4 h-4" />
                          Configurar
                        </Button>
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${item.key}`} className="sr-only">
                        {isEnabled ? 'Desativar' : 'Ativar'} {item.title}
                      </Label>
                      <Switch
                        id={`toggle-${item.key}`}
                        checked={isEnabled}
                        onCheckedChange={() => toggleSection(item.key)}
                      />
                      {isEnabled ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-text-muted" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Order */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Ordem de Exibição</CardTitle>
          <CardDescription>
            As seções serão exibidas nesta ordem no site público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sortedSections
              .filter((item) => sections[item.key].enabled)
              .map((item, index) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 bg-black-elevated px-3 py-2 rounded-lg"
                >
                  <span className="text-gold font-bold">{index + 1}</span>
                  <span className="text-white-primary">{item.title}</span>
                </div>
              ))}
          </div>
          {sortedSections.filter((item) => sections[item.key].enabled).length === 0 && (
            <p className="text-gray-text-muted">
              Nenhuma seção ativada. Ative pelo menos uma seção para exibir conteúdo no site.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
