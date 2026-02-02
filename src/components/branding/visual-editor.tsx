'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Loader2,
    Palette,
    Type,
    Layout,
    Eye,
    Monitor,
    Smartphone,
    Save,
    RotateCcw
} from 'lucide-react'
import {
    getBrandingSettings,
    updateBrandingSettings,
    type BrandingSettings,
} from '@/actions/branding'
import {
    getHomepageSettings,
    updateHomepageSettings,
    type HomepageSettings
} from '@/actions/homepage'
import {
    getAvailableFonts,
    getDefaultBrandingSettings,
    getAvailableThemeOptions,
    getDefaultHomepageSettings
} from '@/lib/branding-constants'
import { cn } from '@/lib/utils'

export function VisualEditor() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

    const [branding, setBranding] = useState<BrandingSettings>(getDefaultBrandingSettings())
    const [homepage, setHomepage] = useState<HomepageSettings>(getDefaultHomepageSettings())

    const fonts = getAvailableFonts()
    const themeOptions = getAvailableThemeOptions()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [brandingRes, homepageRes] = await Promise.all([
            getBrandingSettings(),
            getHomepageSettings()
        ])

        if (brandingRes.success && brandingRes.data) {
            setBranding(brandingRes.data)
        }
        if (homepageRes.success && homepageRes.data) {
            setHomepage(homepageRes.data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const [bRes, hRes] = await Promise.all([
                updateBrandingSettings(branding),
                updateHomepageSettings(homepage)
            ])

            if (bRes.success && hRes.success) {
                setSuccess('Alterações salvas com sucesso!')
                setTimeout(() => setSuccess(''), 3000)
                router.refresh()
            } else {
                setError(bRes.error || hRes.error || 'Erro ao salvar alterações')
            }
        } catch (err) {
            setError('Ocorreu um erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[600px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] gap-6 overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                <Tabs defaultValue="visual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="visual" className="gap-2">
                            <Palette className="w-4 h-4" /> Visual
                        </TabsTrigger>
                        <TabsTrigger value="content" className="gap-2">
                            <Layout className="w-4 h-4" /> Conteúdo
                        </TabsTrigger>
                    </TabsList>

                    {/* Visual Settings */}
                    <TabsContent value="visual" className="space-y-6 pt-4">
                        {/* Theme Mode */}
                        <Card className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Palette className="w-4 h-4 text-primary" /> Estilo Geral
                            </h3>

                            <div className="space-y-2">
                                <Label>Modo do Tema</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {themeOptions.modes.map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setBranding({ ...branding, theme: { ...branding.theme, mode: mode.value as any } })}
                                            className={cn(
                                                "px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                                                branding.theme?.mode === mode.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                            )}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Cores Principais</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-1 flex-1">
                                        <input
                                            type="color"
                                            value={branding.colors?.primary}
                                            onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, primary: e.target.value } })}
                                            className="w-full h-10 rounded-md cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500">Primária</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 flex-1">
                                        <input
                                            type="color"
                                            value={branding.colors?.secondary}
                                            onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, secondary: e.target.value } })}
                                            className="w-full h-10 rounded-md cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500">Secundária</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Typography */}
                        <Card className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Type className="w-4 h-4 text-primary" /> Tipografia
                            </h3>

                            <div className="space-y-2">
                                <Label>Fonte dos Títulos</Label>
                                <select
                                    value={branding.fonts?.heading}
                                    onChange={(e) => setBranding({ ...branding, fonts: { ...branding.fonts, heading: e.target.value } })}
                                    className="w-full p-2 rounded-md border border-gray-200 text-sm"
                                >
                                    {fonts.heading.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Arredondamento (Border Radius)</Label>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    {themeOptions.radius.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setBranding({ ...branding, theme: { ...branding.theme, borderRadius: r.value as any } })}
                                            className={cn(
                                                "px-2 py-1.5 rounded-md border transition-all",
                                                branding.theme?.borderRadius === r.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-white text-gray-600 border-gray-200"
                                            )}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Content Settings */}
                    <TabsContent value="content" className="space-y-6 pt-4">
                        <Card className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" /> Hero (Cabeçalho)
                            </h3>

                            <div className="space-y-2">
                                <Label>Título Principal</Label>
                                <Input
                                    value={homepage.hero?.title}
                                    onChange={(e) => setHomepage({ ...homepage, hero: { ...homepage.hero!, title: e.target.value } })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subtítulo</Label>
                                <textarea
                                    className="w-full p-3 text-sm border rounded-lg resize-none h-24"
                                    value={homepage.hero?.subtitle}
                                    onChange={(e) => setHomepage({ ...homepage, hero: { ...homepage.hero!, subtitle: e.target.value } })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>Exibir Hero</Label>
                                <input
                                    type="checkbox"
                                    checked={homepage.hero?.enabled}
                                    onChange={(e) => setHomepage({ ...homepage, hero: { ...homepage.hero!, enabled: e.target.checked } })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Global Actions */}
                <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-4 pb-2 flex gap-2 border-t mt-auto">
                    <Button
                        className="flex-1 gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Tudo
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => { if (confirm('Resetar alterações?')) loadData() }}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                {success && <p className="text-xs text-green-600 font-medium">{success}</p>}
            </div>

            {/* Main Preview */}
            <div className="flex-1 bg-gray-100 rounded-2xl overflow-hidden flex flex-col border border-gray-200 shadow-inner">
                {/* Preview Toolbar */}
                <div className="bg-white px-6 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 italic">
                            Seu Site Ekkle (Preview Vivo)
                        </span>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={cn("p-1.5 rounded-md transition-all", previewMode === 'desktop' ? "bg-white shadow-sm text-primary" : "text-gray-400")}
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={cn("p-1.5 rounded-md transition-all", previewMode === 'mobile' ? "bg-white shadow-sm text-primary" : "text-gray-400")}
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Iframe-like Preview Content */}
                <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
                    <div
                        className={cn(
                            "bg-white transition-all duration-500 overflow-hidden shadow-2xl relative",
                            previewMode === 'desktop' ? "w-full" : "w-[375px] h-[667px] rounded-[40px] border-[12px] border-gray-900"
                        )}
                        style={{
                            fontFamily: branding.fonts?.body,
                            borderRadius: previewMode === 'mobile' ? '40px' : branding.theme?.borderRadius === 'full' ? '24px' : branding.theme?.borderRadius === 'lg' ? '12px' : '0px'
                        }}
                    >
                        {/* Header / Nav */}
                        <div
                            className={cn(
                                "p-4 flex items-center justify-between",
                                branding.theme?.navStyle === 'blur' ? "bg-white/70 backdrop-blur-md sticky top-0 z-10" : "bg-white"
                            )}
                            style={{ borderBottom: branding.theme?.navStyle === 'solid' ? `1px solid ${branding.colors?.primary}20` : 'none' }}
                        >
                            <div className="font-black text-xl flex items-center gap-2" style={{ color: branding.colors?.primary }}>
                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.colors?.primary }} />
                                Ekkle
                            </div>
                            <div className="flex gap-4 text-xs font-semibold text-gray-600">
                                <span>Inicio</span>
                                <span>Eventos</span>
                                <span>Sobre</span>
                            </div>
                        </div>

                        {/* Hero Section */}
                        {homepage.hero?.enabled && (
                            <div
                                className="py-20 px-8 text-center space-y-4"
                                style={{
                                    backgroundColor: branding.theme?.mode === 'dark' ? '#111' : branding.theme?.mode === 'glass' ? branding.colors?.primary + '08' : '#fff',
                                    color: branding.theme?.mode === 'dark' ? '#fff' : '#111'
                                }}
                            >
                                <h1
                                    className="text-4xl md:text-6xl font-black tracking-tight"
                                    style={{ fontFamily: branding.fonts?.heading }}
                                >
                                    {homepage.hero.title}
                                </h1>
                                <p className="text-lg opacity-70 max-w-xl mx-auto leading-relaxed">
                                    {homepage.hero.subtitle}
                                </p>
                                <div className="pt-6">
                                    <button
                                        className="px-8 py-3 font-bold text-primary-foreground transition-transform hover:scale-105"
                                        style={{
                                            backgroundColor: branding.colors?.primary,
                                            borderRadius: branding.theme?.borderRadius === 'none' ? '0' : branding.theme?.borderRadius === 'sm' ? '4px' : branding.theme?.borderRadius === 'md' ? '8px' : branding.theme?.borderRadius === 'lg' ? '12px' : '9999px'
                                        }}
                                    >
                                        {homepage.hero.cta?.text || 'Saiba Mais'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Mock Events Card */}
                        <div className="p-8 space-y-6">
                            <h2
                                className="text-2xl font-bold"
                                style={{ fontFamily: branding.fonts?.heading }}
                            >
                                Próximos Eventos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-xl space-y-2">
                                    <div className="w-full aspect-video bg-gray-100 rounded-lg" />
                                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                                </div>
                                <div className="p-4 border rounded-xl space-y-2">
                                    <div className="w-full aspect-video bg-gray-100 rounded-lg" />
                                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
