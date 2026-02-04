'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ticket, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTicket, type TicketPriority, type TicketCategory } from '@/actions/super-admin/tickets'

export default function NewTicketPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'medium' as TicketPriority,
        category: '' as TicketCategory | '',
        requesterEmail: '',
        requesterName: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.subject.trim()) {
            setError('Assunto e obrigatorio')
            return
        }

        startTransition(async () => {
            try {
                const ticket = await createTicket({
                    subject: formData.subject,
                    description: formData.description || undefined,
                    priority: formData.priority,
                    category: formData.category || undefined,
                    requesterEmail: formData.requesterEmail || undefined,
                    requesterName: formData.requesterName || undefined
                })

                router.push(`/admin/support/${ticket.id}`)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao criar ticket')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <Link
                href="/admin/support"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para tickets
            </Link>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20">
                    <Ticket className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Novo Ticket</h1>
                    <p className="text-zinc-400">Crie um ticket de suporte manualmente</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Assunto *
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Descreva o problema brevemente"
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Descricao
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Descreva o problema em detalhes..."
                            rows={5}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                        />
                    </div>

                    {/* Priority & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Prioridade
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TicketPriority }))}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Categoria
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TicketCategory }))}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="">Selecione...</option>
                                <option value="billing">Cobranca</option>
                                <option value="technical">Tecnico</option>
                                <option value="feature_request">Solicitacao</option>
                                <option value="bug">Bug</option>
                                <option value="account">Conta</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requester Info */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400">
                        Informacoes do Solicitante (opcional)
                    </h3>
                    <p className="text-xs text-zinc-500 -mt-2">
                        Preencha caso o ticket nao seja de um usuario cadastrado
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Nome
                            </label>
                            <input
                                type="text"
                                value={formData.requesterName}
                                onChange={(e) => setFormData(prev => ({ ...prev, requesterName: e.target.value }))}
                                placeholder="Nome do solicitante"
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.requesterEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, requesterEmail: e.target.value }))}
                                placeholder="email@exemplo.com"
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Criando...' : 'Criar Ticket'}
                    </button>
                    <Link
                        href="/admin/support"
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    )
}
