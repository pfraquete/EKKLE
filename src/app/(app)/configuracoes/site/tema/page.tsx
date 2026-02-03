'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, Palette, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWebsiteSettings, updateSiteTheme } from '@/actions/site-settings'
import { SiteTheme, defaultSiteTheme } from '@/types/site-settings'

const fontOptions = [
  { value: 'Inter', label: 'Inter (Moderno)' },
  { value: 'Poppins', label: 'Poppins (Amigável)' },
  { value: 'Montserrat', label: 'Montserrat (Elegante)' },
  { value: 'Playfair Display', label: 'Playfair Display (Clássico)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
]

const radiusOptions = [
  { value: 'none', label: 'Sem arredondamento' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra Grande' },
  { value: 'full', label: 'Totalmente Arredondado' },
]

const presetThemes = [
  {
    name: 'Dourado Premium',
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#1A1A1A',
      accentColor: '#F2D675',
      backgroundColor: '#0B0B0B',
      textColor: '#FFFFFF',
    },
  },
  {
    name: 'Azul Celestial',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E3A5F',
      accentColor: '#60A5FA',
      backgroundColor: '#0F172A',
      textColor: '#F8FAFC',
    },
  },
  {
    name: 'Verde Esperança',
    theme: {
      primaryColor: '#22C55E',
      secondaryColor: '#14532D',
      accentColor: '#4ADE80',
      backgroundColor: '#0A1F0A',
      textColor: '#F0FDF4',
    },
  },
  {
    name: 'Roxo Espiritual',
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#2E1065',
      accentColor: '#A78BFA',
      backgroundColor: '#0C0A1D',
      textColor: '#FAF5FF',
    },
  },
  {
    name: 'Branco Clássico',
    theme: {
      primaryColor: '#1F2937',
      secondaryColor: '#F3F4F6',
      accentColor: '#6B7280',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
    },
  },
]

export default function ThemeConfigPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [theme, setTheme] = useState<SiteTheme>(defaultSiteTheme)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await getWebsiteSettings()
    if (result.success && result.data) {
      setTheme(result.data.theme)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    const result = await updateSiteTheme(theme)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setTheme({
      ...theme,
      ...preset.theme,
    })
  }

  const resetToDefault = () => {
    setTheme(defaultSiteTheme)
  }

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
              <Palette className="w-7 h-7 text-gold" />
              Cores e Tema
            </h1>
            <p className="text-gray-text-secondary">
              Personalize as cores e o estilo visual do seu site
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetToDefault} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Resetar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <CheckCircle className="w-4 h-4" />
            ) : null}
            {saving ? 'Salvando...' : success ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Preset Themes */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Temas Predefinidos</CardTitle>
          <CardDescription>
            Escolha um tema pronto ou personalize as cores abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {presetThemes.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-4 rounded-xl border border-gray-border hover:border-gold/50 transition-all group"
                style={{ backgroundColor: preset.theme.backgroundColor }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: preset.theme.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.theme.accentColor }}
                  />
                </div>
                <p
                  className="text-sm font-medium group-hover:opacity-100 opacity-80 transition-opacity"
                  style={{ color: preset.theme.textColor }}
                >
                  {preset.name}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black-surface border-gray-border">
          <CardHeader>
            <CardTitle>Cores Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-gray-border cursor-pointer"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="font-mono"
                  placeholder="#D4AF37"
                />
              </div>
              <p className="text-xs text-gray-text-muted">
                Usada em botões, links e destaques
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-gray-border cursor-pointer"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={theme.secondaryColor}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="font-mono"
                  placeholder="#1A1A1A"
                />
              </div>
              <p className="text-xs text-gray-text-muted">
                Usada em elementos secundários e cards
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-gray-border cursor-pointer"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="font-mono"
                  placeholder="#F2D675"
                />
              </div>
              <p className="text-xs text-gray-text-muted">
                Usada em badges, ícones e hover states
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black-surface border-gray-border">
          <CardHeader>
            <CardTitle>Fundo e Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-gray-border cursor-pointer"
                  style={{ backgroundColor: theme.backgroundColor }}
                >
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="font-mono"
                  placeholder="#0B0B0B"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-gray-border cursor-pointer"
                  style={{ backgroundColor: theme.textColor }}
                >
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={theme.textColor}
                  onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                  className="font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Typography and Style */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Tipografia e Estilo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Fonte Principal</Label>
              <Select
                value={theme.fontFamily}
                onValueChange={(value) => setTheme({ ...theme, fontFamily: value as SiteTheme['fontFamily'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arredondamento dos Cantos</Label>
              <Select
                value={theme.borderRadius}
                onValueChange={(value) => setTheme({ ...theme, borderRadius: value as SiteTheme['borderRadius'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((radius) => (
                    <SelectItem key={radius.value} value={radius.value}>
                      {radius.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-black-surface border-gray-border overflow-hidden">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>
            Veja como as cores ficarão no seu site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl p-8 space-y-6"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <h2
              className="text-3xl font-bold"
              style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
            >
              Bem-vindo à Nossa Igreja
            </h2>
            <p
              className="text-lg opacity-80"
              style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
            >
              Uma comunidade de fé, esperança e amor.
            </p>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor,
                  borderRadius: theme.borderRadius === 'full' ? '9999px' : theme.borderRadius === 'xl' ? '16px' : theme.borderRadius === 'lg' ? '12px' : theme.borderRadius === 'md' ? '8px' : theme.borderRadius === 'sm' ? '4px' : '0px',
                  fontFamily: theme.fontFamily,
                }}
              >
                Saiba Mais
              </button>
              <button
                className="px-6 py-3 font-semibold border-2 transition-opacity hover:opacity-90"
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.primaryColor,
                  backgroundColor: 'transparent',
                  borderRadius: theme.borderRadius === 'full' ? '9999px' : theme.borderRadius === 'xl' ? '16px' : theme.borderRadius === 'lg' ? '12px' : theme.borderRadius === 'md' ? '8px' : theme.borderRadius === 'sm' ? '4px' : '0px',
                  fontFamily: theme.fontFamily,
                }}
              >
                Contato
              </button>
            </div>
            <div
              className="p-6 mt-6"
              style={{
                backgroundColor: theme.secondaryColor,
                borderRadius: theme.borderRadius === 'full' ? '24px' : theme.borderRadius === 'xl' ? '16px' : theme.borderRadius === 'lg' ? '12px' : theme.borderRadius === 'md' ? '8px' : theme.borderRadius === 'sm' ? '4px' : '0px',
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: theme.accentColor }}
              >
                Próximo Evento
              </span>
              <h3
                className="text-xl font-bold mt-2"
                style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
              >
                Culto de Celebração
              </h3>
              <p
                className="opacity-70 mt-1"
                style={{ color: theme.textColor }}
              >
                Domingo às 10h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
