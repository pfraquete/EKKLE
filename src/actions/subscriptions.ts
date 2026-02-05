'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createEkkleSubscription,
  createEkklePlan,
  cancelSubscription as cancelPagarmeSubscription,
  getSubscription as getPagarmeSubscription,
  getSubscriptionInvoices as getPagarmeInvoices,
  createOrder,
  getOrder,
  PagarmeError,
} from '@/lib/pagarme';

// =====================================================
// TYPES
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: 'month' | 'year';
  interval_count: number;
  trial_days: number;
  pagarme_plan_id: string | null;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  church_id: string;
  plan_id: string;
  pagarme_subscription_id: string | null;
  pagarme_customer_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  church_id: string;
  pagarme_invoice_id: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  due_date: string | null;
  boleto_url: string | null;
  pix_qr_code: string | null;
  created_at?: string;
}

// =====================================================
// GET PLANS
// =====================================================

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }

  return data || [];
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    console.error('Error fetching plan:', error);
    return null;
  }

  return data;
}

// =====================================================
// GET CHURCH SUBSCRIPTION
// =====================================================

export async function getChurchSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();

  // Get current user's church
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
  }

  return data;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getChurchSubscription();
  
  if (!subscription) return false;
  
  const activeStatuses = ['active', 'trialing'];
  if (!activeStatuses.includes(subscription.status)) return false;
  
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    if (endDate < new Date()) return false;
  }
  
  return true;
}

// =====================================================
// CREATE SUBSCRIPTION
// =====================================================

interface CreateSubscriptionInput {
  plan_id: string;
  payment_method: 'credit_card' | 'boleto' | 'pix';
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
  card?: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
    billingAddress?: {
      line1: string;
      zipCode: string;
      city: string;
      state: string;
    };
  };
}

export async function createChurchSubscription(input: CreateSubscriptionInput) {
  const supabase = await createClient();

  // Get current user's church
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Perfil não encontrado' };
  }

  if (profile.role !== 'PASTOR') {
    return { success: false, error: 'Apenas pastores podem gerenciar assinaturas' };
  }

  // Check if already has active subscription
  const existingSubscription = await getChurchSubscription();
  if (existingSubscription && ['active', 'trialing'].includes(existingSubscription.status)) {
    return { success: false, error: 'Já existe uma assinatura ativa' };
  }

  // Get plan
  const plan = await getSubscriptionPlan(input.plan_id);
  if (!plan) {
    return { success: false, error: 'Plano não encontrado' };
  }

  // Ensure plan exists in Pagar.me
  let pagarmePlanId = plan.pagarme_plan_id;
  if (!pagarmePlanId) {
    try {
      const pagarmePlan = await createEkklePlan({
        name: plan.name,
        description: plan.description || '',
        priceCents: plan.price_cents,
        interval: plan.interval,
        intervalCount: plan.interval_count,
        trialDays: plan.trial_days,
      });
      
      pagarmePlanId = pagarmePlan.id;
      
      // Update plan with Pagar.me ID
      await supabase
        .from('subscription_plans')
        .update({ pagarme_plan_id: pagarmePlanId })
        .eq('id', plan.id);
    } catch (error: unknown) {
      console.error('Error creating Pagar.me plan:', error);
      return { success: false, error: 'Erro ao criar plano no gateway de pagamento' };
    }
  }

  try {
    // Create subscription in Pagar.me
    const pagarmeSubscription = await createEkkleSubscription({
      planId: pagarmePlanId!,
      paymentMethod: input.payment_method,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: input.customer.document,
        phone: input.customer.phone,
      },
      card: input.card,
      metadata: {
        church_id: profile.church_id,
        plan_id: plan.id,
      },
    });

    // Calculate period dates from response
    const currentCycle = pagarmeSubscription.current_cycle;
    const periodStart = currentCycle?.start_at || new Date().toISOString();
    const periodEnd = currentCycle?.end_at || calculatePeriodEnd(plan.interval, plan.interval_count);

    // Map Pagar.me status to our status
    const status = mapPagarmeStatus(pagarmeSubscription.status);

    // Create subscription in database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        church_id: profile.church_id,
        plan_id: plan.id,
        pagarme_subscription_id: pagarmeSubscription.id,
        pagarme_customer_id: pagarmeSubscription.customer?.id,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError);
      return { success: false, error: 'Erro ao salvar assinatura' };
    }

    // Get boleto URL if payment method is boleto
    let boletoUrl: string | undefined;
    let boletoBarcode: string | undefined;

    if (input.payment_method === 'boleto') {
      try {
        const invoices = await getPagarmeInvoices(pagarmeSubscription.id);
        const firstInvoice = invoices.data?.[0];
        if (firstInvoice?.charge?.last_transaction) {
          boletoUrl = firstInvoice.charge.last_transaction.boleto_url;
          boletoBarcode = firstInvoice.charge.last_transaction.boleto_barcode;
        }
      } catch (e) {
        console.error('Error fetching invoice:', e);
      }
    }

    revalidatePath('/configuracoes/assinatura');
    revalidatePath('/dashboard');

    return {
      success: true,
      subscription,
      boleto_url: boletoUrl,
      boleto_barcode: boletoBarcode,
    };
  } catch (error: unknown) {
    console.error('Error creating subscription:', error);

    // Parse Pagar.me error
    let errorMessage = 'Erro ao processar pagamento';
    if (error instanceof PagarmeError) {
      if (error.data?.errors) {
        const errors = error.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.map((e: { message?: string; description?: string }) => e.message || e.description || '').join(', ');
        }
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

// =====================================================
// CANCEL SUBSCRIPTION
// =====================================================

export async function cancelChurchSubscription(cancelImmediately: boolean = false) {
  const supabase = await createClient();

  // Get current user's church
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'PASTOR') {
    return { success: false, error: 'Apenas pastores podem cancelar assinaturas' };
  }

  const subscription = await getChurchSubscription();
  if (!subscription) {
    return { success: false, error: 'Nenhuma assinatura encontrada' };
  }

  if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
    return { success: false, error: 'Assinatura não pode ser cancelada' };
  }

  try {
    // Cancel in Pagar.me
    if (subscription.pagarme_subscription_id) {
      await cancelPagarmeSubscription(subscription.pagarme_subscription_id, cancelImmediately);
    }

    // Update in database
    const updateData: {
      canceled_at: string;
      status?: string;
      cancel_at_period_end?: boolean;
    } = {
      canceled_at: new Date().toISOString(),
    };

    if (cancelImmediately) {
      updateData.status = 'canceled';
    } else {
      updateData.cancel_at_period_end = true;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: 'Erro ao atualizar assinatura' };
    }

    revalidatePath('/configuracoes/assinatura');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: unknown) {
    console.error('Error canceling subscription:', error);
    return { success: false, error: 'Erro ao cancelar assinatura' };
  }
}

// =====================================================
// GET INVOICES
// =====================================================

export async function getSubscriptionInvoices(): Promise<SubscriptionInvoice[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// SYNC SUBSCRIPTION STATUS
// =====================================================

export async function syncSubscriptionStatus() {
  const subscription = await getChurchSubscription();
  if (!subscription || !subscription.pagarme_subscription_id) {
    return { success: false, error: 'Nenhuma assinatura para sincronizar' };
  }

  try {
    const pagarmeSubscription = await getPagarmeSubscription(subscription.pagarme_subscription_id);
    
    const newStatus = mapPagarmeStatus(pagarmeSubscription.status);

    const supabase = await createClient();

    const updateData: {
      status: string;
      current_period_end?: string;
    } = { status: newStatus };

    if (pagarmeSubscription.current_cycle?.end_at) {
      updateData.current_period_end = pagarmeSubscription.current_cycle.end_at;
    }

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    revalidatePath('/configuracoes/assinatura');

    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return { success: false, error: 'Erro ao sincronizar assinatura' };
  }
}

// =====================================================
// HELPERS
// =====================================================

function mapPagarmeStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    future: 'pending',
    pending: 'pending',
  };
  return statusMap[pagarmeStatus] || pagarmeStatus;
}

function calculatePeriodEnd(interval: 'month' | 'year', intervalCount: number): string {
  const now = new Date();
  if (interval === 'month') {
    now.setMonth(now.getMonth() + intervalCount);
  } else {
    now.setFullYear(now.getFullYear() + intervalCount);
  }
  return now.toISOString();
}


// =====================================================
// PIX PAYMENT FOR ANNUAL PLAN
// =====================================================

interface CreatePixPaymentInput {
  plan_id: string;
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
}

interface PixPaymentResult {
  success: boolean;
  error?: string;
  order_id?: string;
  pix_qr_code?: string;
  pix_qr_code_url?: string;
  pix_expires_at?: string;
  amount_cents?: number;
}

/**
 * Create a PIX payment for annual subscription
 * PIX is only available for annual plans (one-time payment)
 */
export async function createPixPaymentForAnnualPlan(input: CreatePixPaymentInput): Promise<PixPaymentResult> {
  const supabase = await createClient();

  // Get current user's church
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Perfil não encontrado' };
  }

  if (profile.role !== 'PASTOR') {
    return { success: false, error: 'Apenas pastores podem gerenciar assinaturas' };
  }

  // Check if already has active subscription
  const existingSubscription = await getChurchSubscription();
  if (existingSubscription && ['active', 'trialing'].includes(existingSubscription.status)) {
    return { success: false, error: 'Já existe uma assinatura ativa' };
  }

  // Get plan
  const plan = await getSubscriptionPlan(input.plan_id);
  if (!plan) {
    return { success: false, error: 'Plano não encontrado' };
  }

  // PIX is only available for annual plans
  if (plan.interval !== 'year') {
    return { success: false, error: 'PIX está disponível apenas para o plano anual' };
  }

  try {
    // Determine document type
    const cleanDocument = input.customer.document.replace(/\D/g, '');
    const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ';
    const customerType = cleanDocument.length <= 11 ? 'individual' : 'company';

    // Parse phone
    let phones;
    if (input.customer.phone) {
      const cleanPhone = input.customer.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        phones = {
          mobile_phone: {
            country_code: '55',
            area_code: cleanPhone.substring(0, 2),
            number: cleanPhone.substring(2),
          },
        };
      }
    }

    // Create order with PIX payment
    const order = await createOrder({
      code: `annual-${profile.church_id}-${Date.now()}`,
      items: [
        {
          amount: plan.price_cents,
          description: `${plan.name} - Assinatura Anual`,
          quantity: 1,
        },
      ],
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: cleanDocument,
        document_type: documentType,
        type: customerType,
        phones,
      },
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: 3600, // 1 hour
            additional_information: [
              { name: 'Igreja', value: profile.church_id },
              { name: 'Plano', value: plan.name },
            ],
          },
        },
      ],
      metadata: {
        church_id: profile.church_id,
        plan_id: plan.id,
        type: 'annual_subscription',
      },
      closed: true,
    });

    // Extract PIX info from response
    const charge = order.charges?.[0];
    const pixTransaction = charge?.last_transaction;

    if (!pixTransaction?.qr_code) {
      console.error('PIX QR code not found in response:', order);
      return { success: false, error: 'Erro ao gerar QR Code PIX' };
    }

    // Save pending subscription in database
    const periodEnd = calculatePeriodEnd('year', 1);
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        church_id: profile.church_id,
        plan_id: plan.id,
        pagarme_order_id: order.id,
        status: 'pending',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError);
      return { success: false, error: 'Erro ao salvar assinatura' };
    }

    // Save invoice record
    await supabase.from('subscription_invoices').insert({
      subscription_id: subscription.id,
      church_id: profile.church_id,
      pagarme_invoice_id: order.id,
      amount_cents: plan.price_cents,
      status: 'pending',
      payment_method: 'pix',
      due_date: pixTransaction.expires_at,
      pix_qr_code: pixTransaction.qr_code,
    });

    return {
      success: true,
      order_id: order.id,
      pix_qr_code: pixTransaction.qr_code,
      pix_qr_code_url: pixTransaction.qr_code_url,
      pix_expires_at: pixTransaction.expires_at,
      amount_cents: plan.price_cents,
    };
  } catch (error: unknown) {
    console.error('Error creating PIX payment:', error);

    let errorMessage = 'Erro ao processar pagamento PIX';
    if (error instanceof PagarmeError) {
      if (error.data?.errors) {
        const errors = error.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.map((e: { message?: string; description?: string }) => e.message || e.description || '').join(', ');
        }
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Check PIX payment status
 */
export async function checkPixPaymentStatus(orderId: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  error?: string;
}> {
  try {
    const order = await getOrder(orderId);
    const charge = order.charges?.[0];
    
    const isPaid = charge?.status === 'paid';
    
    if (isPaid) {
      // Update subscription status to active
      const supabase = await createClient();
      
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('pagarme_order_id', orderId);
      
      await supabase
        .from('subscription_invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('pagarme_invoice_id', orderId);
      
      revalidatePath('/configuracoes/assinatura');
      revalidatePath('/dashboard');
    }
    
    return {
      success: true,
      status: charge?.status || order.status,
      paid: isPaid,
    };
  } catch (error) {
    console.error('Error checking PIX status:', error);
    return { success: false, error: 'Erro ao verificar status do pagamento' };
  }
}
