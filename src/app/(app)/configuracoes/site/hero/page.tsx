'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, Image as ImageIcon, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { getWebsiteSettings, updateSiteSections } from '@/actions/site-settings'
import { SiteHero, defaultSiteHero } from '@/types/site-settings'

export default function HeroConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hero, setHero] = useState<SiteHero>(defaultSiteHero)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await getWebsiteSettings()
    if (result.success && result.data) {
      setHero(result.data.sections.hero)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    const result = await updateSiteSections({ hero })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
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
              <ImageIcon className="w-7 h-7 text-blue-500" />
              Hero e Banner
            </h1>
            <p className="text-gray-text-secondary">
              Configure a seção principal do seu site
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

      {/* Enable/Disable */}
      <Card className="bg-black-surface border-gray-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white-primary">Exibir Hero</h3>
              <p className="text-sm text-gray-text-secondary">
                Ative para mostrar a seção de destaque no topo do site
              </p>
            </div>
            <Switch
              checked={hero.enabled}
              onCheckedChange={(checked) => setHero({ ...hero, enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {hero.enabled && (
        <>
          {/* Texts */}
          <Card className="bg-black-surface border-gray-border">
            <CardHeader>
              <CardTitle>Textos</CardTitle>
              <CardDescription>
                Configure o título e subtítulo do hero
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Título Principal</Label>
                <Input
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  placeholder="Bem-vindo à nossa igreja"
                />
                <p className="text-xs text-gray-text-muted">
                  Deixe em branco para usar o nome da igreja
                </p>
              </div>

              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Textarea
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="Uma comunidade de fé e amor"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Alinhamento do Texto</Label>
                <Select
                  value={hero.textAlign}
                  onValueChange={(value) => setHero({ ...hero, textAlign: value as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card className="bg-black-surface border-gray-border">
            <CardHeader>
              <CardTitle>Imagem de Fundo</CardTitle>
              <CardDescription>
                Configure a imagem e overlay do hero
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input
                  value={hero.backgroundUrl}
                  onChange={(e) => setHero({ ...hero, backgroundUrl: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                <p className="text-xs text-gray-text-muted">
                  Use uma imagem de alta resolução (recomendado: 1920x1080)
                </p>
              </div>

              {hero.backgroundUrl && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={hero.backgroundUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: hero.backgroundOverlay / 100 }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Opacidade do Overlay: {hero.backgroundOverlay}%</Label>
                <Slider
                  value={[hero.backgroundOverlay]}
                  onValueChange={(value) => setHero({ ...hero, backgroundOverlay: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-gray-text-muted">
                  Ajuste para melhorar a legibilidade do texto
                </p>
              </div>

              <div className="space-y-2">
                <Label>Altura do Hero</Label>
                <Select
                  value={hero.minHeight}
                  onValueChange={(value) => setHero({ ...hero, minHeight: value as 'small' | 'medium' | 'large' | 'full' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno (300px)</SelectItem>
                    <SelectItem value="medium">Médio (500px)</SelectItem>
                    <SelectItem value="large">Grande (700px)</SelectItem>
                    <SelectItem value="full">Tela Cheia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* CTA Button */}
          <Card className="bg-black-surface border-gray-border">
            <CardHeader>
              <CardTitle>Botão Principal (CTA)</CardTitle>
              <CardDescription>
                Configure o botão de chamada para ação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white-primary">Exibir Botão</h3>
                  <p className="text-sm text-gray-text-secondary">
                    Mostrar botão de ação no hero
                  </p>
                </div>
                <Switch
                  checked={hero.cta.enabled}
                  onCheckedChange={(checked) => setHero({
                    ...hero,
                    cta: { ...hero.cta, enabled: checked }
                  })}
                />
              </div>

              {hero.cta.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input
                        value={hero.cta.text}
                        onChange={(e) => setHero({
                          ...hero,
                          cta: { ...hero.cta, text: e.target.value }
                        })}
                        placeholder="Saiba Mais"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link do Botão</Label>
                      <Input
                        value={hero.cta.link}
                        onChange={(e) => setHero({
                          ...hero,
                          cta: { ...hero.cta, link: e.target.value }
                        })}
                        placeholder="/sobre"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estilo do Botão</Label>
                    <Select
                      value={hero.cta.style}
                      onValueChange={(value) => setHero({
                        ...hero,
                        cta: { ...hero.cta, style: value as 'primary' | 'secondary' | 'outline' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primário (Destaque)</SelectItem>
                        <SelectItem value="secondary">Secundário</SelectItem>
                        <SelectItem value="outline">Contorno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Secondary CTA */}
          <Card className="bg-black-surface border-gray-border">
            <CardHeader>
              <CardTitle>Botão Secundário</CardTitle>
              <CardDescription>
                Adicione um segundo botão opcional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white-primary">Exibir Botão Secundário</h3>
                  <p className="text-sm text-gray-text-secondary">
                    Mostrar um segundo botão ao lado do principal
                  </p>
                </div>
                <Switch
                  checked={hero.secondaryCta?.enabled || false}
                  onCheckedChange={(checked) => setHero({
                    ...hero,
                    secondaryCta: {
                      enabled: checked,
                      text: hero.secondaryCta?.text || 'Contato',
                      link: hero.secondaryCta?.link || '/contato',
                    }
                  })}
                />
              </div>

              {hero.secondaryCta?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={hero.secondaryCta.text}
                      onChange={(e) => setHero({
                        ...hero,
                        secondaryCta: { ...hero.secondaryCta!, text: e.target.value }
                      })}
                      placeholder="Contato"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link do Botão</Label>
                    <Input
                      value={hero.secondaryCta.link}
                      onChange={(e) => setHero({
                        ...hero,
                        secondaryCta: { ...hero.secondaryCta!, link: e.target.value }
                      })}
                      placeholder="/contato"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
