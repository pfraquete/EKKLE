'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function RegisterPage() {
    const router = useRouter()
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">Solicitação Enviada!</h2>
                        <p className="text-muted-foreground">
                            Seus dados foram enviados para a liderança da igreja.
                            <br />
                            Assim que aprovado, você receberá um email com as instruções de acesso.
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/login">Voltar para o Login</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
                <CardHeader className="space-y-1 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Link>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">Criar Conta</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Preencha seus dados para solicitar acesso como membro
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input id="fullName" name="fullName" required placeholder="Seu nome completo" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Celular (WhatsApp)</Label>
                            <Input id="phone" name="phone" type="tel" required placeholder="(00) 00000-0000" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Mensagem (Opcional)</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Ex: Sou visitante há 2 meses e gostaria de ser membro."
                                className="resize-none"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Solicitar Cadastro'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
