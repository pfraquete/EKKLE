'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FormError } from '@/components/ui/form-error'
import { Loader2, Upload, ArrowUp, ArrowDown, Eye, EyeOff, Sparkles } from 'lucide-react'
import {
  getHomepageSettings,
  updateHomepageSettings,
  uploadHeroBackground,
  type HomepageSettings,
} from '@/actions/homepage'
import { getDefaultHomepageSettings, getAvailableSections } from '@/lib/branding-constants'

export function HomepageEditor() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settings, setSettings] = useState<HomepageSettings>(getDefaultHomepageSettings())
  const availableSections = getAvailableSections()

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getHomepageSettings()
    if (result.success && result.data) {
      setSettings(result.data)
    } else {
      setSettings(getDefaultHomepageSettings())
    }
    setLoading(false)
  }

  const handleHeroBackgroundUpload = async (file: File | null) => {
    if (!file) return

    setUploadingHero(true)
    setError('')

    const result = await uploadHeroBackground(file)

    if (result.success && result.url) {
      setSettings({
        ...settings,
        hero: {
          ...settings.hero!,
          backgroundUrl: result.url,
        },
      })
      setSuccess('Imagem de fundo enviada com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Erro ao fazer upload')
    }

    setUploadingHero(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const result = await updateHomepageSettings(settings)

    if (result.success) {
      setSuccess('Homepage atualizada com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } else {
      setError(result.error || 'Erro ao salvar configurações')
    }

    setSaving(false)
  }

  const handleReset = () => {
    if (confirm('Deseja restaurar a homepage para o padrão?')) {
      setSettings(getDefaultHomepageSettings())
    }
  }

  const toggleSection = (sectionId: string) => {
    if (!settings.sections) return

    const section = settings.sections[sectionId as keyof typeof settings.sections]
    if (!section) return

    setSettings({
      ...settings,
      sections: {
        ...settings.sections,
        [sectionId]: {
          ...section,
          enabled: !section.enabled,
        },
      },
    })
  }

  const moveSectionUp = (sectionId: string) => {
    if (!settings.sections) return

    const section = settings.sections[sectionId as keyof typeof settings.sections]
    if (!section) return

    const currentOrder = section.order
    if (currentOrder <= 1) return

    // Find section with order - 1
    const targetSection = Object.entries(settings.sections).find(
      ([, s]) => s?.order === currentOrder - 1
    )

    if (targetSection) {
      const [targetId, targetSec] = targetSection
      if (!targetSec) return

      setSettings({
        ...settings,
        sections: {
          ...settings.sections,
          [sectionId]: {
            ...section,
            order: currentOrder - 1,
          },
          [targetId]: {
            ...targetSec,
            order: currentOrder,
          },
        },
      })
    }
  }

  const moveSectionDown = (sectionId: string) => {
    if (!settings.sections) return

    const section = settings.sections[sectionId as keyof typeof settings.sections]
    if (!section) return

    const currentOrder = section.order
    const maxOrder = Math.max(
      ...Object.values(settings.sections).map((s) => s?.order || 0)
    )
    if (currentOrder >= maxOrder) return

    // Find section with order + 1
    const targetSection = Object.entries(settings.sections).find(
      ([, s]) => s?.order === currentOrder + 1
    )

    if (targetSection) {
      const [targetId, targetSec] = targetSection
      if (!targetSec) return

      setSettings({
        ...settings,
        sections: {
          ...settings.sections,
          [sectionId]: {
            ...section,
            order: currentOrder + 1,
          },
          [targetId]: {
            ...targetSec,
            order: currentOrder,
          },
        },
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Sort sections by order
  const sortedSections = Object.entries(settings.sections || {})
    .map(([id, section]) => {
      const sectionMeta = availableSections.find((s) => s.id === id)!
      return {
        id,
        name: sectionMeta.name,
        description: sectionMeta.description,
        icon: sectionMeta.icon,
        enabled: section?.enabled || false,
        order: section?.order || 0,
      }
    })
    .sort((a, b) => a.order - b.order)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Hero Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Seção Hero (Destaque)</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSettings({
                ...settings,
                hero: { ...settings.hero!, enabled: !settings.hero?.enabled },
              })
            }
          >
            {settings.hero?.enabled ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Ativado
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Desativado
              </>
            )}
          </Button>
        </div>

        {settings.hero?.enabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Título Principal</Label>
              <Input
                id="hero-title"
                value={settings.hero?.title}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero!, title: e.target.value },
                  })
                }
                placeholder="Bem-vindo à Nossa Igreja"
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Subtítulo</Label>
              <Textarea
                id="hero-subtitle"
                value={settings.hero?.subtitle}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero!, subtitle: e.target.value },
                  })
                }
                placeholder="Venha fazer parte da nossa comunidade de fé"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta-text">Texto do Botão (CTA)</Label>
                <Input
                  id="cta-text"
                  value={settings.hero?.cta?.text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: {
                        ...settings.hero!,
                        cta: {
                          text: e.target.value,
                          link: settings.hero?.cta?.link || '',
                        },
                      },
                    })
                  }
                  placeholder="Conheça Mais"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta-link">Link do Botão</Label>
                <Input
                  id="cta-link"
                  value={settings.hero?.cta?.link}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: {
                        ...settings.hero!,
                        cta: {
                          text: settings.hero?.cta?.text || '',
                          link: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="/sobre"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="hero-background">Imagem de Fundo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {settings.hero?.backgroundUrl ? (
                  <div className="space-y-3">
                    <img
                      src={settings.hero.backgroundUrl}
                      alt="Hero Background"
                      className="max-h-48 mx-auto object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero!, backgroundUrl: undefined },
                        })
                      }
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">
                      PNG, JPG ou WebP (máx. 5MB)
                    </p>
                    <p className="text-xs text-gray-400">
                      Recomendado: 1920x1080px
                    </p>
                  </div>
                )}
              </div>
              <Input
                id="hero-background"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) =>
                  handleHeroBackgroundUpload(e.target.files?.[0] || null)
                }
                disabled={uploadingHero}
                className="cursor-pointer"
              />
              {uploadingHero && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando imagem...
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Sections Management */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Seções da Homepage</h2>
          <p className="text-sm text-gray-600">
            Ative/desative seções e defina a ordem em que aparecem
          </p>
        </div>

        <div className="space-y-3">
          {sortedSections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">
                    #{section.order}
                  </span>
                  <div>
                    <h3 className="font-semibold">{section.name}</h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveSectionUp(section.id)}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveSectionDown(section.id)}
                  disabled={index === sortedSections.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={section.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSection(section.id)}
                >
                  {section.enabled ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Visível
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Oculta
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          Restaurar Padrão
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/configuracoes/site')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || uploadingHero}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
