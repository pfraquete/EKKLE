'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Send,
    Mail,
    MessageSquare,
    Users,
    Building2,
    AlertCircle,
    Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    createCommunication,
    sendCommunication,
    getRecipientsByFilter,
    getTemplates,
    type CommunicationChannel,
    type TargetType,
    type CommunicationTemplate
} from '@/actions/super-admin/communications'

export default function NewCommunicationPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
    const [recipientCount, setRecipientCount] = useState<number | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        content: '',
        channel: 'email' as CommunicationChannel,
        targetType: 'all_churches' as TargetType
    })

    useEffect(() => {
        // Load templates
        getTemplates({ channel: formData.channel }).then(setTemplates)
    }, [formData.channel])

    useEffect(() => {
        // Get recipient count
        getRecipientsByFilter(formData.targetType, {}, []).then(recipients => {
            setRecipientCount(recipients.length)
        })
    }, [formData.targetType])

    const handleTemplateSelect = (template: CommunicationTemplate) => {
        setFormData(prev => ({
            ...prev,
            title: template.name,
            subject: template.subject || '',
            content: template.content
        }))
    }

    const handleSaveDraft = async () => {
        setError(null)

        if (!formData.title.trim()) {
            setError('Titulo e obrigatorio')
            return
        }

        if (!formData.content.trim()) {
            setError('Conteudo e obrigatorio')
            return
        }

        startTransition(async () => {
            try {
                await createCommunication({
                    title: formData.title,
                    subject: formData.subject || undefined,
                    content: formData.content,
                    channel: formData.channel,
                    targetType: formData.targetType
                })

                router.push('/admin/support/communications')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao salvar')
            }
        })
    }

    const handleSendNow = async () => {
        setError(null)

        if (!formData.title.trim()) {
            setError('Titulo e obrigatorio')
            return
        }

        if (!formData.content.trim()) {
            setError('Conteudo e obrigatorio')
            return
        }

        if (recipientCount === 0) {
            setError('Nenhum destinatario encontrado')
            return
        }

        const confirmed = window.confirm(
            `Tem certeza que deseja enviar esta comunicacao para ${recipientCount} destinatario(s)?`
        )

        if (!confirmed) return

        setIsSending(true)
        startTransition(async () => {
            try {
                // Create and send
                const communication = await createCommunication({
                    title: formData.title,
                    subject: formData.subject || undefined,
                    content: formData.content,
                    channel: formData.channel,
                    targetType: formData.targetType
                })

                const result = await sendCommunication(communication.id)

                if (result.success) {
                    router.push('/admin/support/communications')
                } else {
                    setError(`Enviado com erros: ${result.delivered} entregues, ${result.failed} falharam`)
                    setIsSending(false)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao enviar')
                setIsSending(false)
            }
        })
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <Link
                href="/admin/support/communications"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para comunicacoes
            </Link>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20">
                    <Send className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Nova Comunicacao</h1>
                    <p className="text-zinc-400">Envie mensagens para seus clientes</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Channel */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Canal de Envio</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, channel: 'email' }))}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors',
                                    formData.channel === 'email'
                                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                                )}
                            >
                                <Mail className="h-5 w-5" />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, channel: 'whatsapp' }))}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors',
                                    formData.channel === 'whatsapp'
                                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                                )}
                            >
                                <MessageSquare className="h-5 w-5" />
                                WhatsApp
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, channel: 'both' }))}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors',
                                    formData.channel === 'both'
                                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                                )}
                            >
                                <Send className="h-5 w-5" />
                                Ambos
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400">Conteudo</h3>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Titulo (interno)
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Anuncio nova funcionalidade"
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>

                        {(formData.channel === 'email' || formData.channel === 'both') && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Assunto do Email
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Assunto que aparecera no email"
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Mensagem
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Digite a mensagem... Use {{nome}} para personalizar"
                                rows={8}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none font-mono text-sm"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                Variaveis disponiveis: {'{{nome}}'}, {'{{pastor_name}}'}, {'{{church_name}}'}, {'{{email}}'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSendNow}
                            disabled={isPending || isSending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                            {isSending ? 'Enviando...' : 'Enviar Agora'}
                        </button>
                        <button
                            onClick={handleSaveDraft}
                            disabled={isPending || isSending}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            Salvar Rascunho
                        </button>
                        <Link
                            href="/admin/support/communications"
                            className="px-6 py-2.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Cancelar
                        </Link>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Recipients */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Destinatarios
                        </h3>
                        <select
                            value={formData.targetType}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value as TargetType }))}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        >
                            <option value="all_churches">Todas as Igrejas</option>
                            <option value="by_status">Por Status da Igreja</option>
                            <option value="by_plan">Por Plano</option>
                        </select>

                        {recipientCount !== null && (
                            <div className="mt-3 p-3 bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-300">
                                        {recipientCount} destinatario(s)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Templates */}
                    {templates.length > 0 && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <h3 className="text-sm font-medium text-zinc-400 mb-3">
                                Templates
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="w-full text-left px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                    >
                                        <p className="text-sm text-zinc-200 truncate">{template.name}</p>
                                        {template.category && (
                                            <p className="text-xs text-zinc-500 capitalize">{template.category}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
                    </button>

                    {showPreview && formData.content && (
                        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
                            <p className="text-xs text-zinc-500 mb-2">Preview:</p>
                            <div className="text-sm text-zinc-200 whitespace-pre-wrap">
                                {formData.content
                                    .replace(/\{\{nome\}\}/g, 'Pastor')
                                    .replace(/\{\{pastor_name\}\}/g, 'Pastor Silva')
                                    .replace(/\{\{church_name\}\}/g, 'Igreja Exemplo')
                                    .replace(/\{\{email\}\}/g, 'pastor@igreja.com')
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
