'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Church, Users, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function CadastroEkklePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate password
    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula')
      setLoading(false)
      return
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra minúscula')
      setLoading(false)
      return
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('A senha deve conter pelo menos um número')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ekkle-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta')
      }

      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao criar conta')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-4 text-foreground">Bem-vindo ao Ekkle!</h2>
            <p className="text-muted-foreground mb-8">
              Sua conta foi criada com sucesso. Agora você pode fazer login e encontrar sua comunidade de fé.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-primary text-primary-foreground px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
          <CardHeader className="space-y-1 bg-muted/30 border-b border-border text-center p-4 sm:p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 relative bg-primary/10 rounded-2xl p-2 shadow-inner flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Ekkle"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground tracking-tight">
                  Criar Conta no Ekkle
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  Encontre sua comunidade de fé
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Benefits Section */}
          <div className="p-4 sm:p-6 bg-muted/10 border-b border-border">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encontre Igrejas</span>
              </div>
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <Church className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Afilie-se</span>
              </div>
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conecte-se</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Telefone (Opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 rounded-xl bg-background border-border"
                />
                <p className="text-xs text-muted-foreground ml-1">
                  Deve conter: maiúscula, minúscula e número
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl mt-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>

          <div className="p-6 bg-muted/20 text-center text-sm border-t border-border">
            <span className="text-muted-foreground font-medium">Já tem uma conta?</span>{' '}
            <Link href="/login" className="text-primary hover:underline font-black">
              Fazer Login
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          É pastor?{' '}
          <Link href="/register" className="text-primary hover:underline font-bold">
            Cadastre sua igreja aqui
          </Link>
        </p>
      </div>
    </div>
  )
}
