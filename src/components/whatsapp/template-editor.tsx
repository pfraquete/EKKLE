'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { upsertTemplate, MessageTemplate } from '@/actions/templates'
import { toast } from 'sonner'
import { Loader2, Save, Info } from 'lucide-react'

type TemplateCategory =
    | 'BIRTHDAY'
    | 'REMINDER'
    | 'WELCOME'
    | 'CUSTOM'
    | 'FIRST_CONTACT'
    | 'ABSENCE'
    | 'EVENT_REMINDER'
    | 'EVENT_THANKYOU'
    | 'OUTSIDE_HOURS'

interface CategoryConfig {
    value: TemplateCategory
    label: string
    variables: string[]
    description: string
}

const CATEGORIES: CategoryConfig[] = [
    {
        value: 'BIRTHDAY',
        label: 'Aniversário',
        variables: ['nome', 'idade'],
        description: 'Mensagem enviada automaticamente no aniversário do membro'
    },
    {
        value: 'REMINDER',
        label: 'Lembrete de Reunião',
        variables: ['nome', 'celula', 'data', 'hora', 'local'],
        description: 'Lembrete enviado antes das reuniões de célula'
    },
    {
        value: 'WELCOME',
        label: 'Boas-vindas',
        variables: ['nome', 'igreja'],
        description: 'Mensagem para novos membros cadastrados'
    },
    {
        value: 'FIRST_CONTACT',
        label: 'Primeiro Contato',
        variables: ['nome'],
        description: 'Primeira interação do agente com um novo contato'
    },
    {
        value: 'ABSENCE',
        label: 'Acompanhamento de Ausência',
        variables: ['nome', 'dias_ausente'],
        description: 'Mensagem para membros que não comparecem há alguns dias'
    },
    {
        value: 'EVENT_REMINDER',
        label: 'Lembrete de Evento',
        variables: ['nome', 'evento', 'data', 'hora'],
        description: 'Lembrete enviado antes de eventos especiais'
    },
    {
        value: 'EVENT_THANKYOU',
        label: 'Agradecimento pós-Evento',
        variables: ['nome', 'evento'],
        description: 'Mensagem de agradecimento após participação em evento'
    },
    {
        value: 'OUTSIDE_HOURS',
        label: 'Fora do Horário',
        variables: ['horario_inicio', 'horario_fim'],
        description: 'Resposta automática fora do horário de atendimento'
    },
    {
        value: 'CUSTOM',
        label: 'Personalizado',
        variables: ['nome'],
        description: 'Template customizado para outras situações'
    },
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
                    <TabsList className="flex flex-wrap h-auto p-1 bg-muted/50 gap-1">
                        {CATEGORIES.map(cat => (
                            <TabsTrigger key={cat.value} value={cat.value} className="py-2 px-3 text-xs font-bold tracking-wider">
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {CATEGORIES.map(cat => (
                        <TabsContent key={cat.value} value={cat.value} className="space-y-4">
                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3 text-sm text-blue-600">
                                <Info className="h-5 w-5 flex-shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">{cat.description}</p>
                                    <div>
                                        <p className="font-bold">Variáveis disponíveis:</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {cat.variables.map(variable => (
                                                <code key={variable} className="bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">
                                                    {`{${variable}}`}
                                                </code>
                                            ))}
                                        </div>
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
                                <p className="text-xs text-muted-foreground italic">
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
