'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { FormError } from '@/components/ui/form-error'
import { Loader2, Upload, Eye, Palette, Type, Image } from 'lucide-react'
import {
  getBrandingSettings,
  updateBrandingSettings,
  uploadBrandingFile,
  getAvailableFonts,
  getDefaultBrandingSettings,
  type BrandingSettings,
} from '@/actions/branding'

export function BrandingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settings, setSettings] = useState<BrandingSettings>(getDefaultBrandingSettings())
  const fonts = getAvailableFonts()

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getBrandingSettings()
    if (result.success && result.data) {
      // Merge with defaults to ensure all fields exist
      const defaults = getDefaultBrandingSettings()
      setSettings({
        colors: { ...defaults.colors, ...result.data.colors },
        fonts: { ...defaults.fonts, ...result.data.fonts },
        logo: { ...defaults.logo, ...result.data.logo },
      })
    }
    setLoading(false)
  }

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [key]: value,
      },
    })
  }

  const handleFontChange = (key: 'heading' | 'body', value: string) => {
    setSettings({
      ...settings,
      fonts: {
        ...settings.fonts,
        [key]: value,
      },
    })
  }

  const handleFileUpload = async (
    file: File | null,
    type: 'logo' | 'favicon'
  ) => {
    if (!file) return

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon
    setUploading(true)
    setError('')

    const result = await uploadBrandingFile(file, type)

    if (result.success && result.url) {
      setSettings({
        ...settings,
        logo: {
          ...settings.logo,
          [type === 'logo' ? 'url' : 'favicon_url']: result.url,
        },
      })
      setSuccess(`${type === 'logo' ? 'Logo' : 'Favicon'} enviado com sucesso!`)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Erro ao fazer upload')
    }

    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const result = await updateBrandingSettings(settings)

    if (result.success) {
      setSuccess('Configurações salvas com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } else {
      setError(result.error || 'Erro ao salvar configurações')
    }

    setSaving(false)
  }

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setSettings(getDefaultBrandingSettings())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Colors Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Cores do Tema</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="color-primary">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="color-primary"
                  type="color"
                  value={settings.colors?.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.colors?.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  placeholder="#4F46E5"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                Usada em botões principais e destaques
              </p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="color-secondary">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="color-secondary"
                  type="color"
                  value={settings.colors?.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.colors?.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                Usada em elementos complementares
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="color-accent">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="color-accent"
                  type="color"
                  value={settings.colors?.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.colors?.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  placeholder="#F59E0B"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                Usada para chamar atenção
              </p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Pré-visualização</Label>
            <div className="flex gap-3">
              <div
                className="h-16 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: settings.colors?.primary }}
              >
                Primária
              </div>
              <div
                className="h-16 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: settings.colors?.secondary }}
              >
                Secundária
              </div>
              <div
                className="h-16 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: settings.colors?.accent }}
              >
                Destaque
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fonts Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Type className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Tipografia</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Heading Font */}
          <div className="space-y-2">
            <Label htmlFor="font-heading">Fonte dos Títulos</Label>
            <select
              id="font-heading"
              value={settings.fonts?.heading}
              onChange={(e) => handleFontChange('heading', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {fonts.heading.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: settings.fonts?.heading }}
            >
              Exemplo de Título
            </p>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label htmlFor="font-body">Fonte do Texto</Label>
            <select
              id="font-body"
              value={settings.fonts?.body}
              onChange={(e) => handleFontChange('body', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {fonts.body.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <p
              className="text-base"
              style={{ fontFamily: settings.fonts?.body }}
            >
              Exemplo de parágrafo com texto corrido.
            </p>
          </div>
        </div>
      </Card>

      {/* Logo & Favicon Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Image className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Logo e Ícones</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label htmlFor="logo-upload">Logo da Igreja</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {settings.logo?.url ? (
                <div className="space-y-3">
                  <img
                    src={settings.logo.url}
                    alt="Logo"
                    className="max-h-32 mx-auto object-contain"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        logo: { ...settings.logo, url: undefined },
                      })
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    PNG, JPG, SVG ou WebP (máx. 2MB)
                  </p>
                </div>
              )}
            </div>
            <Input
              id="logo-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'logo')}
              disabled={uploadingLogo}
              className="cursor-pointer"
            />
            {uploadingLogo && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </p>
            )}
          </div>

          {/* Favicon Upload */}
          <div className="space-y-3">
            <Label htmlFor="favicon-upload">Favicon (Ícone do Site)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {settings.logo?.favicon_url ? (
                <div className="space-y-3">
                  <img
                    src={settings.logo.favicon_url}
                    alt="Favicon"
                    className="w-16 h-16 mx-auto object-contain"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        logo: { ...settings.logo, favicon_url: undefined },
                      })
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    PNG ou ICO (recomendado 32x32px)
                  </p>
                </div>
              )}
            </div>
            <Input
              id="favicon-upload"
              type="file"
              accept="image/png,image/x-icon"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'favicon')}
              disabled={uploadingFavicon}
              className="cursor-pointer"
            />
            {uploadingFavicon && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Pré-visualização do Site</h2>
        </div>

        <div
          className="border rounded-lg p-6 space-y-4"
          style={{
            fontFamily: settings.fonts?.body,
          }}
        >
          {settings.logo?.url && (
            <img
              src={settings.logo.url}
              alt="Logo"
              className="h-12 object-contain"
            />
          )}
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: settings.fonts?.heading,
              color: settings.colors?.primary,
            }}
          >
            Bem-vindo à Nossa Igreja
          </h1>
          <p className="text-gray-700">
            Este é um exemplo de como o site da sua igreja ficará com as
            configurações escolhidas.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: settings.colors?.primary }}
            >
              Botão Primário
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: settings.colors?.secondary }}
            >
              Botão Secundário
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: settings.colors?.accent }}
            >
              Botão Destaque
            </button>
          </div>
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
          <Button type="submit" disabled={saving}>
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
