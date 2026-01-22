'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { upsertTemplate, MessageTemplate } from '@/actions/templates'
import { toast } from 'sonner'
import { Loader2, Save, Info } from 'lucide-react'

type TemplateCategory = 'BIRTHDAY' | 'REMINDER' | 'WELCOME' | 'CUSTOM'

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
    { value: 'BIRTHDAY', label: 'Aniversário' },
    { value: 'REMINDER', label: 'Lembrete de Reunião' },
    { value: 'WELCOME', label: 'Boas-vindas' },
    { value: 'CUSTOM', label: 'Personalizado' },
]

export function TemplateEditor({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
    const [templates, setTemplates] = useState<Partial<MessageTemplate>[]>(initialTemplates)
    const [activeTab, setActiveTab] = useState<TemplateCategory>(
        (initialTemplates[0]?.category as TemplateCategory) || 'BIRTHDAY'
    )
    const [loading, setLoading] = useState(false)

    const getCurrentTemplate = (category: TemplateCategory) => {
        return templates.find(t => t.category === category) || {
            category: category,
            name: `Template de ${category}`,
            content: '',
            is_active: true
        }
    }

    const handleSave = async (category: TemplateCategory) => {
        const template = getCurrentTemplate(category)
        if (!template.content) {
            toast.error('O conteúdo do template não pode estar vazio')
            return
        }

        setLoading(true)
        try {
            const { data, error: upsertError } = await upsertTemplate({
                ...template
            } as MessageTemplate)
            if (upsertError) throw upsertError

            if (data) {
                setTemplates(prev => {
                    const index = prev.findIndex(t => t.category === category)
                    if (index >= 0) {
                        const next = [...prev]
                        next[index] = data
                        return next
                    }
                    return [...prev, data]
                })
            }

            toast.success('Template salvo com sucesso!')
        } catch (error) {
            console.error('Save template error:', error)
            toast.error('Erro ao salvar template')
        } finally {
            setLoading(false)
        }
    }

    const updateContent = (category: TemplateCategory, content: string) => {
        setTemplates(prev => {
            const index = prev.findIndex(t => t.category === category)
            if (index >= 0) {
                const next = [...prev]
                next[index] = { ...next[index], content }
                return next
            }
            return [...prev, { category: category, content, is_active: true, name: `Template de ${category}` }]
        })
    }

    return (
        <Card className="border-none shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Personalizar Mensagens</CardTitle>
                <CardDescription>
                    Use as variáveis abaixo para personalizar suas mensagens automáticas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateCategory)} className="space-y-6">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50">
                        {CATEGORIES.map(cat => (
                            <TabsTrigger key={cat.value} value={cat.value} className="py-2 text-xs font-bold uppercase tracking-wider">
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {CATEGORIES.map(cat => (
                        <TabsContent key={cat.value} value={cat.value} className="space-y-4">
                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3 text-sm text-blue-600">
                                <Info className="h-5 w-5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-bold">Variáveis disponíveis:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <code className="bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{'{nome}'}</code>
                                        <code className="bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{'{data}'}</code>
                                        <code className="bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{'{hora}'}</code>
                                        <code className="bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{'{local}'}</code>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Conteúdo da Mensagem</label>
                                <Textarea
                                    placeholder="Digite a mensagem aqui..."
                                    className="min-h-[150px] resize-none border-2 focus-visible:ring-blue-500 rounded-xl"
                                    value={getCurrentTemplate(cat.value).content || ''}
                                    onChange={(e) => updateContent(cat.value, e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Dica: Use emojis para tornar a mensagem mais amigável! ✨
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => handleSave(cat.value)} disabled={loading} className="font-bold rounded-xl px-8">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
