'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, Loader2, Copy, Check } from 'lucide-react';
import {
  getSubscriptionPlans,
  getChurchSubscription,
  cancelChurchSubscription,
  createPixPaymentForAnnualPlan,
  checkPixPaymentStatus,
  type SubscriptionPlan,
  type Subscription,
} from '@/actions/subscriptions';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Ativa', variant: 'default' },
    trialing: { label: 'Período de Teste', variant: 'secondary' },
    pending: { label: 'Pendente', variant: 'outline' },
    past_due: { label: 'Atrasada', variant: 'destructive' },
    canceled: { label: 'Cancelada', variant: 'destructive' },
    expired: { label: 'Expirada', variant: 'destructive' },
    unpaid: { label: 'Não Paga', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AssinaturaPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  
  // PIX payment state
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url?: string;
    expires_at?: string;
    order_id?: string;
    amount_cents?: number;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, subscriptionData] = await Promise.all([
          getSubscriptionPlans(),
          getChurchSubscription(),
        ]);
        setPlans(plansData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Poll for PIX payment status
  useEffect(() => {
    if (!pixData?.order_id) return;
    
    const interval = setInterval(async () => {
      try {
        const result = await checkPixPaymentStatus(pixData.order_id!);
        if (result.paid) {
          clearInterval(interval);
          setShowPixModal(false);
          setPixData(null);
          // Reload subscription data
          const updatedSubscription = await getChurchSubscription();
          setSubscription(updatedSubscription);
          alert('Pagamento confirmado! Sua assinatura está ativa.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [pixData?.order_id]);

  const handleSelectPlan = (planId: string) => {
    router.push(`/configuracoes/assinatura/checkout?plan=${planId}`);
  };

  const handlePixPayment = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPixModal(true);
    setPixData(null);
    setFormError('');
  };

  const handleGeneratePix = async () => {
    if (!selectedPlan) return;
    
    // Validate form
    if (!customerName.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Email válido é obrigatório');
      return;
    }
    if (!customerDocument.trim() || customerDocument.replace(/\D/g, '').length < 11) {
      setFormError('CPF/CNPJ válido é obrigatório');
      return;
    }
    
    setFormError('');
    setPixLoading(true);
    
    try {
      const result = await createPixPaymentForAnnualPlan({
        plan_id: selectedPlan.id,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument,
          phone: customerPhone || undefined,
        },
      });
      
      if (result.success && result.pix_qr_code) {
        setPixData({
          qr_code: result.pix_qr_code,
          qr_code_url: result.pix_qr_code_url,
          expires_at: result.pix_expires_at,
          order_id: result.order_id,
          amount_cents: result.amount_cents,
        });
      } else {
        setFormError(result.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('Error generating PIX:', error);
      setFormError('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qr_code) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    } catch (error) {
      console.error('Error copying PIX:', error);
    }
  };

  const handleCheckPayment = async () => {
    if (!pixData?.order_id) return;
    
    setCheckingPayment(true);
    try {
      const result = await checkPixPaymentStatus(pixData.order_id);
      if (result.paid) {
        setShowPixModal(false);
        setPixData(null);
        const updatedSubscription = await getChurchSubscription();
        setSubscription(updatedSubscription);
        alert('Pagamento confirmado! Sua assinatura está ativa.');
      } else {
        alert('Pagamento ainda não confirmado. Aguarde alguns instantes após realizar o pagamento.');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      alert('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual.')) {
      return;
    }

    setCanceling(true);
    try {
      const result = await cancelChurchSubscription(false);
      if (result.success) {
        const updatedSubscription = await getChurchSubscription();
        setSubscription(updatedSubscription);
        alert('Assinatura cancelada. Você terá acesso até o final do período atual.');
      } else {
        alert(result.error || 'Erro ao cancelar assinatura');
      }
    } catch {
      alert('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie sua assinatura do Ekkle
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sua Assinatura Atual</CardTitle>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-medium">{subscription.plan?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium">
                  {subscription.plan ? formatCurrency(subscription.plan.price_cents) : 'N/A'}
                  {subscription.plan?.interval === 'month' ? '/mês' : '/ano'}
                </p>
              </div>
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                  <p className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {subscription.cancel_at_period_end && (
                <div>
                  <p className="text-sm text-destructive font-medium">
                    Cancelamento agendado para o final do período
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          {hasActiveSubscription && !subscription.cancel_at_period_end && (
            <CardFooter>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Plans */}
      {!hasActiveSubscription && (
        <>
          <h2 className="text-2xl font-bold mb-6">Escolha seu plano</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isAnnual = plan.interval === 'year';
              const monthlyEquivalent = isAnnual
                ? Math.round(plan.price_cents / 12)
                : plan.price_cents;
              const savings = isAnnual
                ? Math.round(((57 * 12 - plan.price_cents / 100) / (57 * 12)) * 100)
                : 0;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isAnnual ? 'border-primary border-2' : ''}`}
                >
                  {isAnnual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Mais Popular - Economize {savings}%
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {formatCurrency(plan.price_cents)}
                      </span>
                      <span className="text-muted-foreground">
                        /{plan.interval === 'month' ? 'mês' : 'ano'}
                      </span>
                      {isAnnual && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Equivalente a {formatCurrency(monthlyEquivalent)}/mês
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 text-left mb-6">
                      {(plan.features as string[]).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    {/* Plano Mensal: apenas Cartão via Stripe */}
                    {!isAnnual && (
                      <Button
                        className="w-full"
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Assinar com Cartão
                      </Button>
                    )}
                    
                    {/* Plano Anual: PIX (Pagar.me) ou Cartão (Stripe) */}
                    {isAnnual && (
                      <>
                        <Button
                          className="w-full"
                          variant="default"
                          onClick={() => handlePixPayment(plan)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Pagar com PIX
                        </Button>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleSelectPlan(plan.id)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagar com Cartão
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Change Plan */}
      {hasActiveSubscription && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Alterar Plano</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {plans
              .filter((plan) => plan.id !== subscription?.plan_id)
              .map((plan) => {
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCurrency(plan.price_cents)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.interval === 'month' ? 'mês' : 'ano'}
                        </span>
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        Mudar para {plan.name}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* PIX Payment Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              {selectedPlan && `${selectedPlan.name} - ${formatCurrency(selectedPlan.price_cents)}`}
            </DialogDescription>
          </DialogHeader>

          {!pixData ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <Label htmlFor="document">CPF/CNPJ *</Label>
                <Input
                  id="document"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(formatDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <Button
                className="w-full"
                onClick={handleGeneratePix}
                disabled={pixLoading}
              >
                {pixLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code PIX
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pixData.qr_code_url && (
                <div className="flex justify-center">
                  <img
                    src={pixData.qr_code_url}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              )}

              <div>
                <Label>Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={pixData.qr_code}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPix}
                  >
                    {pixCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {pixData.expires_at && (
                <p className="text-sm text-muted-foreground text-center">
                  Expira em: {new Date(pixData.expires_at).toLocaleString('pt-BR')}
                </p>
              )}

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-2">Como pagar:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              <Button
                className="w-full"
                variant="outline"
                onClick={handleCheckPayment}
                disabled={checkingPayment}
              >
                {checkingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Já paguei, verificar pagamento'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                O pagamento será confirmado automaticamente em alguns segundos após a transferência.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
