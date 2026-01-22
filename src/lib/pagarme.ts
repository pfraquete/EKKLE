// Pagar.me API v5 Integration
// Documentation: https://docs.pagar.me/reference

const PAGARME_API_URL = process.env.PAGARME_API_URL || 'https://api.pagar.me/core/v5';
const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';

// =====================================================
// API CLIENT
// =====================================================

interface PagarmeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

async function pagarmeRequest<T>(options: PagarmeRequestOptions): Promise<T> {
  const { method, path, body } = options;

  if (!PAGARME_SECRET_KEY) {
    throw new Error('PAGARME_SECRET_KEY não configurada');
  }

  // Basic Auth with secret key
  const authString = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');

  const response = await fetch(`${PAGARME_API_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Pagar.me API Error:', data);
    throw new PagarmeError(data.message || 'Erro na API do Pagar.me', data);
  }

  return data;
}

export class PagarmeError extends Error {
  public data: { errors?: Array<{ message?: string; description?: string }>; message?: string };

  constructor(message: string, data: { errors?: Array<{ message?: string; description?: string }>; message?: string }) {
    super(message);
    this.name = 'PagarmeError';
    this.data = data;
  }
}

// =====================================================
// TYPES
// =====================================================

export interface PagarmeCustomer {
  id?: string;
  name: string;
  email: string;
  document: string;
  document_type: 'CPF' | 'CNPJ';
  type: 'individual' | 'company';
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
  metadata?: Record<string, string>;
}

export interface PagarmePlan {
  id?: string;
  name: string;
  description?: string;
  statement_descriptor?: string;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  billing_type: 'prepaid' | 'postpaid' | 'exact_day';
  billing_days?: number[];
  payment_methods: ('credit_card' | 'boleto' | 'debit_card')[];
  installments?: number[];
  minimum_price?: number;
  trial_period_days?: number;
  items: PagarmePlanItem[];
  metadata?: Record<string, string>;
}

export interface PagarmePlanItem {
  id?: string;
  name: string;
  quantity: number;
  pricing_scheme: {
    scheme_type: 'unit' | 'package' | 'volume' | 'tier';
    price: number; // Em centavos
  };
}

export interface PagarmeSubscription {
  id?: string;
  code?: string;
  plan_id: string;
  customer_id?: string;
  customer?: PagarmeCustomer;
  card?: PagarmeCard;
  payment_method: 'credit_card' | 'boleto' | 'debit_card';
  billing_type?: 'prepaid' | 'postpaid' | 'exact_day';
  statement_descriptor?: string;
  installments?: number;
  start_at?: string;
  minimum_price?: number;
  boleto_due_days?: number;
  metadata?: Record<string, string>;
}

export interface PagarmeCard {
  number?: string;
  holder_name?: string;
  exp_month?: number;
  exp_year?: number;
  cvv?: string;
  billing_address?: {
    line_1: string;
    line_2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface PagarmeSubscriptionResponse {
  id: string;
  code: string;
  status: string;
  start_at: string;
  plan: PagarmePlan;
  customer: PagarmeCustomer;
  card?: { id: string; last_four_digits?: string; brand?: string };
  current_cycle?: {
    id: string;
    start_at: string;
    end_at: string;
    billing_at: string;
    status: string;
  };
  next_billing_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CUSTOMERS
// =====================================================

export async function createCustomer(customer: PagarmeCustomer): Promise<PagarmeCustomer & { id: string }> {
  return pagarmeRequest({
    method: 'POST',
    path: '/customers',
    body: customer,
  });
}

export async function getCustomer(customerId: string): Promise<PagarmeCustomer & { id: string }> {
  return pagarmeRequest({
    method: 'GET',
    path: `/customers/${customerId}`,
  });
}

export async function updateCustomer(customerId: string, customer: Partial<PagarmeCustomer>): Promise<PagarmeCustomer & { id: string }> {
  return pagarmeRequest({
    method: 'PUT',
    path: `/customers/${customerId}`,
    body: customer,
  });
}

// =====================================================
// PLANS
// =====================================================

export async function createPlan(plan: PagarmePlan): Promise<PagarmePlan & { id: string }> {
  return pagarmeRequest({
    method: 'POST',
    path: '/plans',
    body: plan,
  });
}

export async function getPlan(planId: string): Promise<PagarmePlan & { id: string }> {
  return pagarmeRequest({
    method: 'GET',
    path: `/plans/${planId}`,
  });
}

export async function listPlans(): Promise<{ data: (PagarmePlan & { id: string })[] }> {
  return pagarmeRequest({
    method: 'GET',
    path: '/plans',
  });
}

export async function updatePlan(planId: string, plan: Partial<PagarmePlan>): Promise<PagarmePlan & { id: string }> {
  return pagarmeRequest({
    method: 'PUT',
    path: `/plans/${planId}`,
    body: plan,
  });
}

export async function deletePlan(planId: string): Promise<void> {
  return pagarmeRequest({
    method: 'DELETE',
    path: `/plans/${planId}`,
  });
}

// =====================================================
// SUBSCRIPTIONS
// =====================================================

export async function createSubscription(subscription: PagarmeSubscription): Promise<PagarmeSubscriptionResponse> {
  return pagarmeRequest({
    method: 'POST',
    path: '/subscriptions',
    body: subscription,
  });
}

export async function getSubscription(subscriptionId: string): Promise<PagarmeSubscriptionResponse> {
  return pagarmeRequest({
    method: 'GET',
    path: `/subscriptions/${subscriptionId}`,
  });
}

export async function listSubscriptions(params?: { customer_id?: string; status?: string }): Promise<{ data: PagarmeSubscriptionResponse[] }> {
  const queryParams = new URLSearchParams();
  if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return pagarmeRequest({
    method: 'GET',
    path: `/subscriptions${query ? `?${query}` : ''}`,
  });
}

export async function updateSubscription(subscriptionId: string, data: Partial<PagarmeSubscription>): Promise<PagarmeSubscriptionResponse> {
  return pagarmeRequest({
    method: 'PATCH',
    path: `/subscriptions/${subscriptionId}`,
    body: data,
  });
}

export async function cancelSubscription(subscriptionId: string, cancelPendingInvoices: boolean = true): Promise<PagarmeSubscriptionResponse> {
  return pagarmeRequest({
    method: 'DELETE',
    path: `/subscriptions/${subscriptionId}`,
    body: { cancel_pending_invoices: cancelPendingInvoices },
  });
}

// =====================================================
// SUBSCRIPTION CARD
// =====================================================

export async function updateSubscriptionCard(subscriptionId: string, card: PagarmeCard): Promise<PagarmeSubscriptionResponse> {
  return pagarmeRequest({
    method: 'PATCH',
    path: `/subscriptions/${subscriptionId}/card`,
    body: { card },
  });
}

// =====================================================
// INVOICES
// =====================================================

export interface PagarmeInvoice {
  id: string;
  code: string;
  url: string;
  amount: number;
  status: string;
  payment_method: string;
  due_at: string;
  paid_at?: string;
  created_at: string;
  charge?: {
    id: string;
    code: string;
    amount: number;
    status: string;
    payment_method: string;
    last_transaction?: {
      id: string;
      status: string;
      amount: number;
      boleto_url?: string;
      boleto_barcode?: string;
      qr_code?: string;
      qr_code_url?: string;
    };
  };
}

export async function getSubscriptionInvoices(subscriptionId: string): Promise<{ data: PagarmeInvoice[] }> {
  return pagarmeRequest({
    method: 'GET',
    path: `/subscriptions/${subscriptionId}/invoices`,
  });
}

export async function getInvoice(invoiceId: string): Promise<PagarmeInvoice> {
  return pagarmeRequest({
    method: 'GET',
    path: `/invoices/${invoiceId}`,
  });
}

// =====================================================
// WEBHOOK VALIDATION
// =====================================================

import crypto from 'crypto';

const PAGARME_WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET || '';

export function validateWebhookSignature(signature: string | null, payload: string): boolean {
  if (!signature || !PAGARME_WEBHOOK_SECRET) {
    return false;
  }

  // Pagar.me v5 usa HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', PAGARME_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // A assinatura pode vir com prefixo sha256= ou não
  const cleanSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(cleanSignature),
    Buffer.from(expectedSignature)
  );
}

// =====================================================
// HELPERS
// =====================================================

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function getSubscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    active: 'Ativa',
    canceled: 'Cancelada',
    past_due: 'Atrasada',
    unpaid: 'Não paga',
    trialing: 'Em teste',
    expired: 'Expirada',
    future: 'Futura',
  };
  return labels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto Bancário',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
  };
  return labels[method] || method;
}

export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    canceled: 'Cancelado',
    scheduled: 'Agendado',
    failed: 'Falhou',
  };
  return labels[status] || status;
}

// =====================================================
// PLAN CREATION HELPER
// =====================================================

export interface CreateEkklePlanParams {
  name: string;
  description: string;
  priceCents: number;
  interval: 'month' | 'year';
  intervalCount?: number;
  trialDays?: number;
}

export async function createEkklePlan(params: CreateEkklePlanParams): Promise<PagarmePlan & { id: string }> {
  const plan: PagarmePlan = {
    name: params.name,
    description: params.description,
    currency: 'BRL',
    interval: params.interval,
    interval_count: params.intervalCount || 1,
    billing_type: 'prepaid',
    payment_methods: ['credit_card', 'boleto'],
    trial_period_days: params.trialDays,
    items: [
      {
        name: params.name,
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: params.priceCents,
        },
      },
    ],
    metadata: {
      source: 'ekkle',
    },
  };

  return createPlan(plan);
}

// =====================================================
// SUBSCRIPTION CREATION HELPER
// =====================================================

export interface CreateEkkleSubscriptionParams {
  planId: string;
  paymentMethod: 'credit_card' | 'boleto';
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
  metadata?: Record<string, string>;
}

export async function createEkkleSubscription(params: CreateEkkleSubscriptionParams): Promise<PagarmeSubscriptionResponse> {
  // Determine document type
  const cleanDocument = params.customer.document.replace(/\D/g, '');
  const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ';
  const customerType = cleanDocument.length <= 11 ? 'individual' : 'company';

  // Parse phone
  let phones;
  if (params.customer.phone) {
    const cleanPhone = params.customer.phone.replace(/\D/g, '');
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

  const subscription: PagarmeSubscription = {
    plan_id: params.planId,
    payment_method: params.paymentMethod,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document: cleanDocument,
      document_type: documentType,
      type: customerType,
      phones,
    },
    metadata: params.metadata,
  };

  // Add card for credit card payments
  if (params.paymentMethod === 'credit_card' && params.card) {
    subscription.card = {
      number: params.card.number.replace(/\s/g, ''),
      holder_name: params.card.holderName,
      exp_month: params.card.expMonth,
      exp_year: params.card.expYear,
      cvv: params.card.cvv,
    };

    if (params.card.billingAddress) {
      subscription.card.billing_address = {
        line_1: params.card.billingAddress.line1,
        zip_code: params.card.billingAddress.zipCode.replace(/\D/g, ''),
        city: params.card.billingAddress.city,
        state: params.card.billingAddress.state,
        country: 'BR',
      };
    }
  }

  // Set boleto due days for boleto payments
  if (params.paymentMethod === 'boleto') {
    subscription.boleto_due_days = 3;
  }

  return createSubscription(subscription);
}
