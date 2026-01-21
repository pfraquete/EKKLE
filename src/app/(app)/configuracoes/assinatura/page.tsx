'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getSubscriptionPlans,
  getChurchSubscription,
  cancelChurchSubscription,
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

  const handleSelectPlan = (planId: string) => {
    router.push(`/configuracoes/assinatura/checkout?plan=${planId}`);
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
    } catch (error) {
      alert('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
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
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isAnnual ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Assinar {plan.name}
                    </Button>
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
                const isAnnual = plan.interval === 'year';

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
    </div>
  );
}
