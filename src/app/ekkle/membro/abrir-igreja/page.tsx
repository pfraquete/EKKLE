'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Church, CreditCard, Check, Loader2, ArrowRight, ArrowLeft, AlertCircle, Sparkles, CalendarDays, Percent } from 'lucide-react'
import { createChurchCheckoutSession } from '@/actions/create-church'
import { cn } from '@/lib/utils'

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

type PlanInterval = 'month' | 'year'

const PLANS = {
  month: {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Mensal',
    price: 57,
    priceFormatted: 'R$ 57',
    interval: 'mes',
    description: 'Cobranca mensal',
    savings: null,
  },
  year: {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Anual',
    price: 397,
    priceFormatted: 'R$ 397',
    interval: 'ano',
    description: 'Equivale a R$ 33/mes',
    savings: '42% de economia',
  },
}

export default function AbrirIgrejaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled') === 'true'

  const [churchName, setChurchName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>('year')
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
      const result = await createChurchCheckoutSession({
        churchName: name,
        planInterval: selectedPlan,
      })

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

  const currentPlan = PLANS[selectedPlan]

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

      {/* Plan Selection */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider">
          Escolha seu plano
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('month')}
            className={cn(
              "relative p-4 rounded-xl border-2 text-left transition-all",
              selectedPlan === 'month'
                ? "border-amber-500 bg-amber-500/5"
                : "border-muted hover:border-muted-foreground/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                selectedPlan === 'month' ? "bg-amber-500/20" : "bg-muted"
              )}>
                <CalendarDays className={cn(
                  "w-5 h-5",
                  selectedPlan === 'month' ? "text-amber-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{PLANS.month.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{PLANS.month.priceFormatted}</span>
                  <span className="text-muted-foreground text-sm">/{PLANS.month.interval}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {PLANS.month.description}
                </p>
              </div>
            </div>
            {selectedPlan === 'month' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>

          {/* Annual Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('year')}
            className={cn(
              "relative p-4 rounded-xl border-2 text-left transition-all",
              selectedPlan === 'year'
                ? "border-amber-500 bg-amber-500/5"
                : "border-muted hover:border-muted-foreground/30"
            )}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Melhor valor
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                selectedPlan === 'year' ? "bg-amber-500/20" : "bg-muted"
              )}>
                <Sparkles className={cn(
                  "w-5 h-5",
                  selectedPlan === 'year' ? "text-amber-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{PLANS.year.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{PLANS.year.priceFormatted}</span>
                  <span className="text-muted-foreground text-sm">/{PLANS.year.interval}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {PLANS.year.description}
                </p>
                {PLANS.year.savings && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">
                    <Check className="w-3 h-3" />
                    {PLANS.year.savings}
                  </span>
                )}
              </div>
            </div>
            {selectedPlan === 'year' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

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

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plano selecionado</span>
                <span className="font-bold">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-black text-lg">{currentPlan.priceFormatted}/{currentPlan.interval}</span>
              </div>
              {currentPlan.savings && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Economia</span>
                  <span className="font-bold">{currentPlan.savings}</span>
                </div>
              )}
            </div>

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
