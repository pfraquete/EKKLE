'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, Users, MapPin, Clock, User, Grid, List, Map } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWebsiteSettings, updateSiteSections } from '@/actions/site-settings'
import { CellsSectionConfig, defaultCellsSection } from '@/types/site-settings'

const layoutOptions = [
  { value: 'grid', label: 'Grade (Cards)', icon: Grid },
  { value: 'list', label: 'Lista', icon: List },
  { value: 'map', label: 'Mapa', icon: Map },
]

export default function CellsConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [config, setConfig] = useState<CellsSectionConfig>(defaultCellsSection)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await getWebsiteSettings()
    if (result.success && result.data) {
      setConfig(result.data.sections.cells)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    const result = await updateSiteSections({ cells: config })

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
              <Users className="w-7 h-7 text-green-500" />
              Seção de Células
            </h1>
            <p className="text-gray-text-secondary">
              Configure como as células são exibidas no site
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

      {/* Enable Section */}
      <Card className="bg-black-surface border-gray-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">Exibir Seção de Células</Label>
              <p className="text-sm text-gray-text-secondary">
                Quando ativado, a seção de células será exibida no site público
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Textos da Seção</CardTitle>
          <CardDescription>
            Personalize o título e subtítulo da seção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Conheça nossas Células"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea
              value={config.subtitle}
              onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
              placeholder="Encontre uma célula perto de você e faça parte de uma comunidade"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Informações Exibidas</CardTitle>
          <CardDescription>
            Escolha quais informações das células serão mostradas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-black-elevated rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-500" />
                <div>
                  <Label>Endereço</Label>
                  <p className="text-xs text-gray-text-muted">Rua, número e complemento</p>
                </div>
              </div>
              <Switch
                checked={config.showAddress}
                onCheckedChange={(checked) => setConfig({ ...config, showAddress: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black-elevated rounded-xl">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-blue-500" />
                <div>
                  <Label>Bairro</Label>
                  <p className="text-xs text-gray-text-muted">Nome do bairro</p>
                </div>
              </div>
              <Switch
                checked={config.showNeighborhood}
                onCheckedChange={(checked) => setConfig({ ...config, showNeighborhood: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black-elevated rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-500" />
                <div>
                  <Label>Líder</Label>
                  <p className="text-xs text-gray-text-muted">Nome do líder da célula</p>
                </div>
              </div>
              <Switch
                checked={config.showLeader}
                onCheckedChange={(checked) => setConfig({ ...config, showLeader: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black-elevated rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <Label>Horário</Label>
                  <p className="text-xs text-gray-text-muted">Dia e hora da reunião</p>
                </div>
              </div>
              <Switch
                checked={config.showSchedule}
                onCheckedChange={(checked) => setConfig({ ...config, showSchedule: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Layout</CardTitle>
          <CardDescription>
            Escolha como as células serão exibidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {layoutOptions.map((option) => {
              const Icon = option.icon
              const isSelected = config.layout === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, layout: option.value as CellsSectionConfig['layout'] })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-border hover:border-gray-text-muted'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-gold' : 'text-gray-text-secondary'}`} />
                  <p className={`font-medium ${isSelected ? 'text-gold' : 'text-gray-text-secondary'}`}>
                    {option.label}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <Label>Quantidade Máxima de Células</Label>
            <Select
              value={config.maxItems.toString()}
              onValueChange={(value) => setConfig({ ...config, maxItems: parseInt(value) })}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 células</SelectItem>
                <SelectItem value="9">9 células</SelectItem>
                <SelectItem value="12">12 células</SelectItem>
                <SelectItem value="18">18 células</SelectItem>
                <SelectItem value="24">24 células</SelectItem>
                <SelectItem value="999">Todas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-text-muted">
              Limite de células exibidas na página inicial
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black-deep rounded-xl p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white-primary mb-2">{config.title}</h2>
              <p className="text-gray-text-secondary">{config.subtitle}</p>
            </div>

            {config.layout === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-black-surface rounded-xl p-5 border border-gray-border">
                    <h3 className="font-semibold text-white-primary mb-3">Célula {i}</h3>
                    <div className="space-y-2 text-sm text-gray-text-secondary">
                      {config.showNeighborhood && (
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4 text-blue-500" />
                          <span>Centro</span>
                        </div>
                      )}
                      {config.showAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span>Rua Exemplo, 123</span>
                        </div>
                      )}
                      {config.showLeader && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          <span>João Silva</span>
                        </div>
                      )}
                      {config.showSchedule && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>Terça, 19h30</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {config.layout === 'list' && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-black-surface rounded-xl p-4 border border-gray-border flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white-primary">Célula {i}</h3>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-text-secondary">
                        {config.showNeighborhood && <span>Centro</span>}
                        {config.showLeader && <span>João Silva</span>}
                        {config.showSchedule && <span>Terça, 19h30</span>}
                      </div>
                    </div>
                    {config.showAddress && (
                      <span className="text-sm text-gray-text-muted">Rua Exemplo, 123</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {config.layout === 'map' && (
              <div className="bg-black-elevated rounded-xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-12 h-12 text-gray-text-muted mx-auto mb-2" />
                  <p className="text-gray-text-muted">Mapa interativo com localização das células</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
