'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Building2, Lock, User, Mail, Phone, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao realizar cadastro')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-[#18181b] backdrop-blur-xl max-w-md w-full mx-auto">
                <CardContent className="pt-10 pb-10 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Igreja Criada com Sucesso!</h2>
                        <p className="text-zinc-400">
                            Sua conta de pastor e a estrutura da igreja foram configuradas.
                        </p>
                    </div>
                    <Button asChild className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-xl shadow-lg transition-all font-bold">
                        <Link href="/login">Acessar Painel</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-[#18181b]">
                <CardHeader className="space-y-1 bg-zinc-900/50 border-b border-white/5 p-6 text-center">
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/login" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-medium">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Link>
                    </div>
                    <CardTitle className="text-2xl font-black text-white tracking-tight uppercase">Criar Nova Igreja</CardTitle>
                    <CardDescription className="text-zinc-400 font-medium">
                        Configure sua igreja e crie sua conta administrativa
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="churchName" className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                <Building2 className="w-4 h-4 text-white" /> Nome da Igreja
                            </Label>
                            <Input
                                id="churchName"
                                name="churchName"
                                required
                                placeholder="Ex: Igreja Ekkle Central"
                                className="h-11 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                <User className="w-4 h-4 text-white" /> Seu Nome Completo
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                required
                                placeholder="Ex: Pastor João Silva"
                                className="h-11 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                    <Mail className="w-4 h-4 text-white" /> Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    className="h-11 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                    <Phone className="w-4 h-4 text-white" /> Celular
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    placeholder="(00) 00000-0000"
                                    className="h-11 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                <Lock className="w-4 h-4 text-white" /> Senha
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="Crie uma senha segura"
                                minLength={6}
                                className="h-11 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0"
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl mt-2 bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Configurando...
                                </>
                            ) : (
                                'Criar Minha Igreja'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
