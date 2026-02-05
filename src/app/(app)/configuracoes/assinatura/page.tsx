'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  QrCode, 
  Loader2, 
  Copy, 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  getSubscriptionPlans,
  getChurchSubscription,
  cancelChurchSubscription,
  createPixPaymentForAnnualPlan,
  checkPixPaymentStatus,
  getSubscriptionInvoices,
  type SubscriptionPlan,
  type Subscription,
  type SubscriptionInvoice,
} from '@/actions/subscriptions';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; color: string }> = {
    active: { label: 'Ativa', variant: 'default', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-500' },
    trialing: { label: 'Período de Teste', variant: 'secondary', icon: <Clock className="w-4 h-4" />, color: 'text-blue-500' },
    pending: { label: 'Pendente', variant: 'outline', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-500' },
    past_due: { label: 'Atrasada', variant: 'destructive', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500' },
    canceled: { label: 'Cancelada', variant: 'destructive', icon: <XCircle className="w-4 h-4" />, color: 'text-red-500' },
    expired: { label: 'Expirada', variant: 'destructive', icon: <XCircle className="w-4 h-4" />, color: 'text-red-500' },
    unpaid: { label: 'Não Paga', variant: 'destructive', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500' },
    paid: { label: 'Pago', variant: 'default', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-500' },
  };
  return configs[status] || { label: status, variant: 'outline' as const, icon: <Clock className="w-4 h-4" />, color: 'text-muted-foreground' };
}

const planFeatures = [
  { icon: <Users className="w-5 h-5" />, text: 'Membros ilimitados' },
  { icon: <Zap className="w-5 h-5" />, text: 'Células ilimitadas' },
  { icon: <Calendar className="w-5 h-5" />, text: 'Gestão de cultos e eventos' },
  { icon: <Shield className="w-5 h-5" />, text: 'Relatórios completos' },
  { icon: <Crown className="w-5 h-5" />, text: 'Suporte prioritário' },
];

export default function AssinaturaPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [activeTab, setActiveTab] = useState('planos');
  
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
        const [plansData, subscriptionData, invoicesData] = await Promise.all([
          getSubscriptionPlans(),
          getChurchSubscription(),
          getSubscriptionInvoices(),
        ]);
        setPlans(plansData);
        setSubscription(subscriptionData);
        setInvoices(invoicesData);
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
          const [updatedSubscription, updatedInvoices] = await Promise.all([
            getChurchSubscription(),
            getSubscriptionInvoices(),
          ]);
          setSubscription(updatedSubscription);
          setInvoices(updatedInvoices);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);
    
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
        const [updatedSubscription, updatedInvoices] = await Promise.all([
          getChurchSubscription(),
          getSubscriptionInvoices(),
        ]);
        setSubscription(updatedSubscription);
        setInvoices(updatedInvoices);
      } else {
        setFormError('Pagamento ainda não confirmado. Aguarde alguns instantes.');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setFormError('Erro ao verificar pagamento.');
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
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);
  const annualPlan = plans.find(p => p.interval === 'year');
  const monthlyPlan = plans.find(p => p.interval === 'month');

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Assinatura</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e histórico de pagamentos
        </p>
      </div>

      {/* Current Subscription Status Card */}
      {subscription && (
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${hasActiveSubscription ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {hasActiveSubscription ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">{subscription.plan?.name || 'Plano'}</h2>
                    <Badge variant={getStatusConfig(subscription.status).variant}>
                      {getStatusConfig(subscription.status).label}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {subscription.plan ? formatCurrency(subscription.plan.price_cents) : 'N/A'}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      /{subscription.plan?.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subscription.cancel_at_period_end ? 'Acesso até' : 'Próxima cobrança em'}: {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>
              </div>
              
              {hasActiveSubscription && !subscription.cancel_at_period_end && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                >
                  {canceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Cancelar Assinatura
                </Button>
              )}
            </div>
            
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Sua assinatura será cancelada ao final do período atual
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="planos" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="faturas" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Faturas
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="planos" className="space-y-6">
          {!hasActiveSubscription && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Escolha o melhor plano para sua igreja</h2>
              <p className="text-muted-foreground">
                Apenas o pastor paga. Discipuladores, líderes e membros usam gratuitamente.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            {monthlyPlan && (
              <Card className="relative overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{monthlyPlan.name}</CardTitle>
                  <CardDescription>{monthlyPlan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-4">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{formatCurrency(monthlyPlan.price_cents)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-3 text-left mb-6">
                    {planFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="text-primary">{feature.icon}</div>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={hasActiveSubscription && subscription?.plan_id === monthlyPlan.id ? 'secondary' : 'outline'}
                    onClick={() => handleSelectPlan(monthlyPlan.id)}
                    disabled={!!(hasActiveSubscription && subscription?.plan_id === monthlyPlan.id)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {hasActiveSubscription && subscription?.plan_id === monthlyPlan.id ? 'Plano Atual' : 'Assinar com Cartão'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Annual Plan */}
            {annualPlan && (
              <Card className="relative overflow-hidden border-2 border-primary shadow-lg">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
                  Economize 42%
                </div>
                <CardHeader className="text-center pb-2 pt-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{annualPlan.name}</CardTitle>
                  </div>
                  <CardDescription>{annualPlan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-4">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-primary">{formatCurrency(annualPlan.price_cents)}</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Equivalente a {formatCurrency(Math.round(annualPlan.price_cents / 12))}/mês
                  </p>

                  <ul className="space-y-3 text-left mb-6">
                    {planFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="text-primary">{feature.icon}</div>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {hasActiveSubscription && subscription?.plan_id === annualPlan.id ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => handlePixPayment(annualPlan)}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Pagar com PIX
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleSelectPlan(annualPlan.id)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar com Cartão
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="faturas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Histórico de Faturas
              </CardTitle>
              <CardDescription>
                Acompanhe todas as suas faturas e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${invoice.status === 'paid' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                            {statusConfig.icon}
                          </div>
                          <div>
                            <p className="font-medium">{formatCurrency(invoice.amount_cents)}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.payment_method === 'pix' ? 'PIX' : 
                               invoice.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                               invoice.payment_method === 'boleto' ? 'Boleto' : 
                               invoice.payment_method || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={statusConfig.variant} className="mb-1">
                            {statusConfig.label}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {invoice.paid_at ? formatDate(invoice.paid_at) : formatDate(invoice.due_date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PIX Payment Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Pagamento via PIX
            </DialogTitle>
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
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </p>
                </div>
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
                <div className="flex justify-center p-4 bg-white rounded-lg">
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
                    className="text-xs font-mono"
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

              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Como pagar:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCheckPayment}
                disabled={checkingPayment}
              >
                {checkingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Já paguei, verificar pagamento
                  </>
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
