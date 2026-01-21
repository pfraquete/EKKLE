import pagarme from 'pagarme';

// Configuração do Pagar.me
const PAGARME_API_KEY = process.env.PAGARME_API_KEY || '';
const PAGARME_ENCRYPTION_KEY = process.env.PAGARME_ENCRYPTION_KEY || '';

// Tipos
export interface CreateCustomerParams {
  name: string;
  email: string;
  document: string; // CPF ou CNPJ
  document_type: 'cpf' | 'cnpj';
  phone?: {
    country_code: string;
    area_code: string;
    number: string;
  };
}

export interface CreateCardParams {
  card_number: string;
  card_holder_name: string;
  card_expiration_date: string; // MMYY
  card_cvv: string;
}

export interface CreateSubscriptionParams {
  plan_id: string;
  customer_id: string;
  card_id?: string;
  card_hash?: string;
  payment_method: 'credit_card' | 'boleto';
  postback_url?: string;
  metadata?: Record<string, string>;
}

export interface PagarmeClient {
  customers: {
    create: (params: CreateCustomerParams) => Promise<any>;
    find: (params: { id: string }) => Promise<any>;
    all: (params?: any) => Promise<any>;
  };
  cards: {
    create: (params: any) => Promise<any>;
    find: (params: { id: string }) => Promise<any>;
    all: (params: { customer_id: string }) => Promise<any>;
  };
  plans: {
    create: (params: any) => Promise<any>;
    find: (params: { id: string }) => Promise<any>;
    all: (params?: any) => Promise<any>;
    update: (params: any) => Promise<any>;
  };
  subscriptions: {
    create: (params: any) => Promise<any>;
    find: (params: { id: string }) => Promise<any>;
    all: (params?: any) => Promise<any>;
    update: (params: any) => Promise<any>;
    cancel: (params: { id: string }) => Promise<any>;
  };
  transactions: {
    find: (params: { id: string }) => Promise<any>;
    all: (params?: any) => Promise<any>;
  };
  security: {
    encrypt: (card: CreateCardParams) => Promise<string>;
  };
}

// Conectar ao Pagar.me
export async function getPagarmeClient(): Promise<PagarmeClient> {
  if (!PAGARME_API_KEY) {
    throw new Error('PAGARME_API_KEY não configurada');
  }
  
  const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });
  return client as PagarmeClient;
}

// Conectar com encryption key (para frontend)
export async function getPagarmeEncryptionClient(): Promise<PagarmeClient> {
  if (!PAGARME_ENCRYPTION_KEY) {
    throw new Error('PAGARME_ENCRYPTION_KEY não configurada');
  }
  
  const client = await pagarme.client.connect({ encryption_key: PAGARME_ENCRYPTION_KEY });
  return client as PagarmeClient;
}

// =====================================================
// CUSTOMERS
// =====================================================

export async function createCustomer(params: CreateCustomerParams) {
  const client = await getPagarmeClient();
  return client.customers.create(params);
}

export async function getCustomer(customerId: string) {
  const client = await getPagarmeClient();
  return client.customers.find({ id: customerId });
}

// =====================================================
// PLANS
// =====================================================

export interface CreatePlanParams {
  name: string;
  amount: number; // Em centavos
  days: number; // Dias do ciclo (30 para mensal, 365 para anual)
  trial_days?: number;
  payment_methods?: ('credit_card' | 'boleto')[];
  charges?: number | null; // null = infinito
  installments?: number;
}

export async function createPlan(params: CreatePlanParams) {
  const client = await getPagarmeClient();
  return client.plans.create({
    name: params.name,
    amount: params.amount,
    days: params.days,
    trial_days: params.trial_days || 0,
    payment_methods: params.payment_methods || ['credit_card', 'boleto'],
    charges: params.charges,
    installments: params.installments || 1,
  });
}

export async function getPlan(planId: string) {
  const client = await getPagarmeClient();
  return client.plans.find({ id: planId });
}

export async function listPlans() {
  const client = await getPagarmeClient();
  return client.plans.all();
}

// =====================================================
// SUBSCRIPTIONS
// =====================================================

export interface CreatePagarmeSubscriptionParams {
  plan_id: string;
  payment_method: 'credit_card' | 'boleto';
  customer: {
    name: string;
    email: string;
    document_number: string;
    phone?: {
      ddd: string;
      number: string;
    };
  };
  card_hash?: string;
  card_id?: string;
  postback_url?: string;
  metadata?: Record<string, string>;
}

export async function createSubscription(params: CreatePagarmeSubscriptionParams) {
  const client = await getPagarmeClient();
  
  const subscriptionData: any = {
    plan_id: params.plan_id,
    payment_method: params.payment_method,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document_number: params.customer.document_number,
    },
    metadata: params.metadata,
  };

  if (params.customer.phone) {
    subscriptionData.customer.phone = params.customer.phone;
  }

  if (params.postback_url) {
    subscriptionData.postback_url = params.postback_url;
  }

  // Para cartão de crédito
  if (params.payment_method === 'credit_card') {
    if (params.card_hash) {
      subscriptionData.card_hash = params.card_hash;
    } else if (params.card_id) {
      subscriptionData.card_id = params.card_id;
    }
  }

  return client.subscriptions.create(subscriptionData);
}

export async function getSubscription(subscriptionId: string) {
  const client = await getPagarmeClient();
  return client.subscriptions.find({ id: subscriptionId });
}

export async function cancelSubscription(subscriptionId: string) {
  const client = await getPagarmeClient();
  return client.subscriptions.cancel({ id: subscriptionId });
}

export async function updateSubscriptionCard(subscriptionId: string, cardHash: string) {
  const client = await getPagarmeClient();
  return client.subscriptions.update({
    id: subscriptionId,
    card_hash: cardHash,
  });
}

export async function listSubscriptions(params?: { customer_id?: string; status?: string }) {
  const client = await getPagarmeClient();
  return client.subscriptions.all(params);
}

// =====================================================
// CARD HASH (para frontend)
// =====================================================

export async function encryptCard(card: CreateCardParams): Promise<string> {
  const client = await getPagarmeEncryptionClient();
  return client.security.encrypt(card);
}

// =====================================================
// WEBHOOK VALIDATION
// =====================================================

export function validatePostback(signature: string, payload: string): boolean {
  // O Pagar.me envia uma assinatura no header X-Hub-Signature
  // Formato: sha1=<hash>
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha1', PAGARME_API_KEY)
    .update(payload)
    .digest('hex');
  
  return signature === `sha1=${expectedSignature}`;
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
    paid: 'Pago',
    waiting_payment: 'Aguardando pagamento',
    refused: 'Recusado',
    refunded: 'Reembolsado',
  };
  return labels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto Bancário',
    pix: 'PIX',
  };
  return labels[method] || method;
}
