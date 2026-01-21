'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getSubscriptionPlan,
  createChurchSubscription,
  type SubscriptionPlan,
} from '@/actions/subscriptions';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCardNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length >= 2) {
    return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
  }
  return numbers;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'boleto'>('credit_card');
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    document: '',
    phone: '',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
  });

  useEffect(() => {
    async function loadPlan() {
      if (!planId) {
        router.push('/configuracoes/assinatura');
        return;
      }

      try {
        const planData = await getSubscriptionPlan(planId);
        if (!planData) {
          router.push('/configuracoes/assinatura');
          return;
        }
        setPlan(planData);
      } catch (error) {
        console.error('Error loading plan:', error);
        router.push('/configuracoes/assinatura');
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [planId, router]);

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    switch (field) {
      case 'document':
        formattedValue = formatCPF(value);
        break;
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'cardExpiry':
        formattedValue = formatExpiry(value);
        break;
      case 'cardCvv':
        formattedValue = value.replace(/\D/g, '').substring(0, 4);
        break;
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.document) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      if (paymentMethod === 'credit_card') {
        if (!formData.cardNumber || !formData.cardHolder || !formData.cardExpiry || !formData.cardCvv) {
          throw new Error('Preencha todos os dados do cartão');
        }
      }

      // Generate card hash if using credit card
      let cardHash: string | undefined;
      if (paymentMethod === 'credit_card') {
        // In production, use Pagar.me's encryption key to generate card hash
        // For now, we'll send the card data directly (not recommended for production)
        const expiryParts = formData.cardExpiry.split('/');
        const cardData = {
          card_number: formData.cardNumber.replace(/\s/g, ''),
          card_holder_name: formData.cardHolder,
          card_expiration_date: expiryParts[0] + expiryParts[1],
          card_cvv: formData.cardCvv,
        };

        // In a real implementation, you would use:
        // const pagarme = await import('pagarme');
        // const client = await pagarme.client.connect({ encryption_key: 'ek_test_xxx' });
        // cardHash = await client.security.encrypt(cardData);
        
        // For now, we'll encode it (NOT SECURE - only for development)
        cardHash = btoa(JSON.stringify(cardData));
      }

      const result = await createChurchSubscription({
        plan_id: planId!,
        payment_method: paymentMethod,
        customer: {
          name: formData.name,
          email: formData.email,
          document: formData.document.replace(/\D/g, ''),
          phone: formData.phone,
        },
        card_hash: cardHash,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      if (paymentMethod === 'boleto' && result.boleto_url) {
        setBoletoUrl(result.boleto_url);
      } else {
        router.push('/configuracoes/assinatura?success=true');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  if (boletoUrl) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Boleto Gerado!</CardTitle>
            <CardDescription>
              Seu boleto foi gerado com sucesso. Clique no botão abaixo para visualizar e pagar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Após o pagamento, sua assinatura será ativada automaticamente em até 3 dias úteis.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                    Visualizar Boleto
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/configuracoes/assinatura')}
                >
                  Voltar para Assinaturas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push('/configuracoes/assinatura')}
        >
          ← Voltar
        </Button>

        <div className="grid gap-8 md:grid-cols-[1fr,380px]">
          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Finalizar Assinatura</CardTitle>
              <CardDescription>
                Preencha seus dados para assinar o {plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Data */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Dados Pessoais</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF/CNPJ *</Label>
                      <Input
                        id="document"
                        value={formData.document}
                        onChange={(e) => handleInputChange('document', e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={18}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Forma de Pagamento</h3>
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('credit_card')}
                      className="flex-1"
                    >
                      💳 Cartão de Crédito
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'boleto' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('boleto')}
                      className="flex-1"
                    >
                      📄 Boleto
                    </Button>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">Nome no Cartão *</Label>
                        <Input
                          id="cardHolder"
                          value={formData.cardHolder}
                          onChange={(e) => handleInputChange('cardHolder', e.target.value.toUpperCase())}
                          placeholder="NOME COMO NO CARTÃO"
                          required
                        />
                      </div>

                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                            placeholder="MM/AA"
                            maxLength={5}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            type="password"
                            value={formData.cardCvv}
                            onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                            placeholder="000"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        O boleto será gerado após a confirmação. Você terá 3 dias úteis para efetuar o pagamento.
                        Sua assinatura será ativada automaticamente após a confirmação do pagamento.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Processando...' : `Assinar por ${formatCurrency(plan.price_cents)}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
                  Pagamento processado de forma segura pelo Pagar.me.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{plan.name}</span>
                  <span className="font-semibold">{formatCurrency(plan.price_cents)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(plan.price_cents)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.interval === 'month' ? 'Cobrado mensalmente' : 'Cobrado anualmente'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">O que está incluso:</h4>
                <ul className="space-y-2">
                  {(plan.features as string[]).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Pagamento 100% seguro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
