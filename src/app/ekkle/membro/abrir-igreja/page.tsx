'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Church, CreditCard, Check, Loader2, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'
import { createChurchCheckoutSession } from '@/actions/create-church'

const FEATURES = [
  'Gestao ilimitada de celulas',
  'Gestao ilimitada de membros',
  'Relatorios completos',
  'Automacao via WhatsApp',
  'Site personalizado para igreja',
  'Cursos e eventos',
  'Sistema financeiro completo',
  'Suporte prioritario',
]

export default function AbrirIgrejaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled') === 'true'

  const [churchName, setChurchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = churchName.trim()
    if (!name) {
      setError('Nome da igreja e obrigatorio')
      return
    }

    if (name.length < 3) {
      setError('Nome da igreja deve ter pelo menos 3 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createChurchCheckoutSession({ churchName: name })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Erro ao processar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        href="/ekkle/membro"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar ao Painel</span>
      </Link>

      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <Church className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Abrir uma Igreja</h1>
        <p className="text-muted-foreground">
          Crie sua igreja no Ekkle e comece a gerenciar sua comunidade
        </p>
      </div>

      {/* Canceled Alert */}
      {canceled && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-500">Pagamento cancelado</p>
            <p className="text-sm text-muted-foreground">
              Voce cancelou o processo de pagamento. Quando estiver pronto, tente novamente.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Card */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-7 h-7 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">R$ 57</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso completo a todas as funcionalidades
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Completo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-wider">
            O que esta incluido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-wider">
            Dados da Igreja
          </CardTitle>
          <CardDescription>
            Informe o nome da sua igreja para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="churchName" className="text-xs font-bold uppercase tracking-wider">
                Nome da Igreja
              </Label>
              <Input
                id="churchName"
                placeholder="Ex: Igreja Vida Nova"
                value={churchName}
                onChange={(e) => {
                  setChurchName(e.target.value)
                  setError('')
                }}
                disabled={loading}
                className="text-lg py-6"
              />
              <p className="text-xs text-muted-foreground">
                O nome pode ser alterado posteriormente nas configuracoes
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-base font-black uppercase tracking-wider"
              disabled={loading || !churchName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  Continuar para Pagamento
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Voce sera redirecionado para o checkout seguro do Stripe.
              <br />
              Pagamento via cartao de credito.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Security Info */}
      <div className="text-center space-y-2 pb-8">
        <p className="text-xs text-muted-foreground">
          Pagamento processado com seguranca pelo{' '}
          <span className="font-bold">Stripe</span>
        </p>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span className="text-xs">SSL Seguro</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span className="text-xs">Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  )
}
