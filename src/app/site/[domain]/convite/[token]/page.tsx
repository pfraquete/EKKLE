'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { validateInviteToken, type InviteValidationResult } from '@/actions/cell-invites'
import {
    Users,
    MapPin,
    Clock,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ArrowRight
} from 'lucide-react'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function InvitePage() {
    const params = useParams()
    const token = params.token as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validation, setValidation] = useState<InviteValidationResult | null>(null)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        async function validate() {
            const result = await validateInviteToken(token)
            setValidation(result)
            setIsLoading(false)
        }
        validate()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        // Validate password strength
        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres')
            return
        }

        if (!/[A-Z]/.test(password)) {
            setError('A senha deve conter pelo menos uma letra maiúscula')
            return
        }

        if (!/[a-z]/.test(password)) {
            setError('A senha deve conter pelo menos uma letra minúscula')
            return
        }

        if (!/[0-9]/.test(password)) {
            setError('A senha deve conter pelo menos um número')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/member-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    password,
                    inviteToken: token,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
            } else {
                setError(data.error || 'Erro ao criar conta')
            }
        } catch {
            setError('Erro ao conectar com o servidor')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-muted/20">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Validando convite...</p>
                </div>
            </div>
        )
    }

    // Invalid token
    if (!validation?.valid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-muted/20 p-4">
                <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-black text-foreground mb-2">Link Inválido</h2>
                        <p className="text-muted-foreground mb-6">{validation?.error}</p>
                        <Link href="/">
                            <Button variant="outline" className="rounded-xl font-bold">
                                Voltar para a página inicial
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-muted/20 p-4">
                <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-black text-foreground mb-2">Cadastro Concluído!</h2>
                        <p className="text-muted-foreground mb-6">
                            Bem-vindo à célula <span className="font-bold text-foreground">{validation.cell?.name}</span>!
                            Sua conta foi criada com sucesso.
                        </p>
                        <Link href="/login">
                            <Button className="rounded-xl font-bold h-12 px-6 gap-2">
                                Fazer Login
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { cell, church } = validation

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-muted/20 p-4">
            <div className="w-full max-w-lg space-y-6">
                {/* Church Header */}
                <div className="text-center">
                    {church?.logo_url ? (
                        <div className="w-20 h-20 relative bg-white rounded-2xl p-2 shadow-lg mx-auto mb-4">
                            <Image
                                src={church.logo_url}
                                alt={church.name}
                                fill
                                className="object-contain p-2"
                            />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-black text-primary">{church?.name[0]}</span>
                        </div>
                    )}
                    <h1 className="text-2xl font-black text-foreground">{church?.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Convite para Célula</p>
                </div>

                {/* Cell Info Card */}
                <Card className="border-none shadow-lg rounded-2xl bg-primary/5 border border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Users className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground">{cell?.name}</h3>
                                {cell?.leader_name && (
                                    <p className="text-sm text-muted-foreground">
                                        Líder: <span className="font-bold">{cell.leader_name}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                            {cell?.day_of_week !== null && cell?.meeting_time && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{DAYS[cell.day_of_week]} às {cell.meeting_time.slice(0, 5)}</span>
                                </div>
                            )}
                            {cell?.neighborhood && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{cell.neighborhood}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Form */}
                <Card className="border-none shadow-2xl rounded-3xl">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black">Criar sua conta</CardTitle>
                        <CardDescription>
                            Preencha seus dados para se juntar à célula
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Nome Completo
                                </Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    required
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Senha
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Confirmar Senha
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita sua senha"
                                    required
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-xl font-bold text-base mt-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Criando conta...
                                    </>
                                ) : (
                                    'Criar Conta e Entrar na Célula'
                                )}
                            </Button>
                        </form>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary hover:underline font-bold">
                                Fazer login
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
