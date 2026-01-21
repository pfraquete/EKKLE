'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createSubscription as createPagarmeSubscription,
  cancelSubscription as cancelPagarmeSubscription,
  getSubscription as getPagarmeSubscription,
  createPlan,
  formatCurrency,
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
  payment_method: 'credit_card' | 'boleto';
  customer: {
    name: string;
    email: string;
    document: string; // CPF ou CNPJ
    phone?: string;
  };
  card_hash?: string;
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
      const days = plan.interval === 'month' ? 30 : 365;
      const pagarmePlan = await createPlan({
        name: plan.name,
        amount: plan.price_cents,
        days: days,
        trial_days: plan.trial_days,
        payment_methods: ['credit_card', 'boleto'],
      });
      
      pagarmePlanId = pagarmePlan.id.toString();
      
      // Update plan with Pagar.me ID
      await supabase
        .from('subscription_plans')
        .update({ pagarme_plan_id: pagarmePlanId })
        .eq('id', plan.id);
    } catch (error: any) {
      console.error('Error creating Pagar.me plan:', error);
      return { success: false, error: 'Erro ao criar plano no gateway de pagamento' };
    }
  }

  try {
    // Parse phone if provided
    let phone;
    if (input.customer.phone) {
      const cleanPhone = input.customer.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        phone = {
          ddd: cleanPhone.substring(0, 2),
          number: cleanPhone.substring(2),
        };
      }
    }

    // Create subscription in Pagar.me
    const postbackUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagarme`
      : undefined;

    const pagarmeSubscription = await createPagarmeSubscription({
      plan_id: pagarmePlanId!,
      payment_method: input.payment_method,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document_number: input.customer.document.replace(/\D/g, ''),
        phone,
      },
      card_hash: input.card_hash,
      postback_url: postbackUrl,
      metadata: {
        church_id: profile.church_id,
        plan_id: plan.id,
      },
    });

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + plan.interval_count);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + plan.interval_count);
    }

    // Map Pagar.me status to our status
    const statusMap: Record<string, string> = {
      trialing: 'trialing',
      paid: 'active',
      pending_payment: 'pending',
      unpaid: 'unpaid',
      canceled: 'canceled',
      ended: 'expired',
    };

    const status = statusMap[pagarmeSubscription.status] || 'pending';

    // Create subscription in database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        church_id: profile.church_id,
        plan_id: plan.id,
        pagarme_subscription_id: pagarmeSubscription.id.toString(),
        pagarme_customer_id: pagarmeSubscription.customer?.id?.toString(),
        status,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError);
      return { success: false, error: 'Erro ao salvar assinatura' };
    }

    // Create initial invoice record
    const currentTransaction = pagarmeSubscription.current_transaction;
    if (currentTransaction) {
      await supabase.from('subscription_invoices').insert({
        subscription_id: subscription.id,
        church_id: profile.church_id,
        pagarme_invoice_id: currentTransaction.id?.toString(),
        pagarme_charge_id: currentTransaction.id?.toString(),
        amount_cents: plan.price_cents,
        status: currentTransaction.status === 'paid' ? 'paid' : 'pending',
        payment_method: input.payment_method,
        paid_at: currentTransaction.status === 'paid' ? now.toISOString() : null,
        boleto_url: currentTransaction.boleto_url,
        boleto_barcode: currentTransaction.boleto_barcode,
      });
    }

    revalidatePath('/configuracoes/assinatura');
    revalidatePath('/dashboard');

    return {
      success: true,
      subscription,
      boleto_url: currentTransaction?.boleto_url,
      boleto_barcode: currentTransaction?.boleto_barcode,
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    // Parse Pagar.me error
    let errorMessage = 'Erro ao processar pagamento';
    if (error.response?.errors) {
      const errors = error.response.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        errorMessage = errors.map((e: any) => e.message).join(', ');
      }
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
      await cancelPagarmeSubscription(subscription.pagarme_subscription_id);
    }

    // Update in database
    const updateData: any = {
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
  } catch (error: any) {
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
    
    const statusMap: Record<string, string> = {
      trialing: 'trialing',
      paid: 'active',
      pending_payment: 'pending',
      unpaid: 'unpaid',
      canceled: 'canceled',
      ended: 'expired',
    };

    const newStatus = statusMap[pagarmeSubscription.status] || subscription.status;

    const supabase = await createClient();
    await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('id', subscription.id);

    revalidatePath('/configuracoes/assinatura');

    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return { success: false, error: 'Erro ao sincronizar assinatura' };
  }
}
