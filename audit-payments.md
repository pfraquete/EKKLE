# Auditoria de Pagamentos - EKKLE

## Resumo Executivo

| Item | Status | Observações |
|------|--------|-------------|
| Webhook Stripe | ✅ OK | Completo e seguro |
| Webhook Pagar.me | ⚠️ Melhorar | Falta verificação de assinatura |
| Dados Pagar.me | ✅ OK | Todos os campos obrigatórios presentes |
| Estrutura DB | ✅ OK | Suporta ambos os gateways |
| Fluxo Ativação | ✅ OK | Funcional para Stripe e Pagar.me |

---

## 1. Webhook Stripe ✅

**Arquivo:** `/src/app/api/webhooks/stripe/route.ts`

**Eventos tratados:**
- `checkout.session.completed` - Criação de igreja após pagamento
- `checkout.session.expired` - Sessão expirada
- `invoice.paid` - Pagamento confirmado → ativa assinatura
- `invoice.payment_failed` - Pagamento falhou → marca como past_due
- `customer.subscription.created` - Nova assinatura criada
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada

**Segurança:**
- ✅ Verificação de assinatura obrigatória (`STRIPE_WEBHOOK_SECRET`)
- ✅ Sanitização de payload (remove PII)
- ✅ Logging de eventos
- ✅ Sistema de retry para falhas (`processWebhookWithRetry`)

**Ações no banco:**
- Atualiza status da assinatura
- Cria registros de invoices
- Atualiza períodos de assinatura

---

## 2. Webhook Pagar.me ⚠️

**Arquivo:** `/src/app/api/webhooks/pagarme/route.ts`

**Eventos tratados:**
- `order.paid` - Pagamento PIX confirmado → ativa assinatura
- `order.payment_failed` - Pagamento falhou → marca como past_due
- `order.canceled` - Pedido cancelado
- `charge.paid` - Cobrança paga (logging)

**Problemas identificados:**
1. ⚠️ **Falta verificação de assinatura** - O webhook não valida o header `x-hub-signature`
2. ⚠️ **Falta logging estruturado** - Usa `console.log` em vez de logger
3. ⚠️ **Falta sistema de retry** - Não usa `processWebhookWithRetry`

**Recomendações:**
1. Implementar verificação de assinatura HMAC
2. Usar o logger estruturado
3. Adicionar sistema de retry como no Stripe

---

## 3. Dados da Pagar.me ✅

**Dados obrigatórios para PIX:**

| Campo | Enviado | Formato |
|-------|---------|---------|
| customer.name | ✅ | String |
| customer.email | ✅ | Email válido |
| customer.document | ✅ | CPF (11 dígitos) ou CNPJ (14 dígitos) |
| customer.document_type | ✅ | 'CPF' ou 'CNPJ' |
| customer.type | ✅ | 'individual' ou 'company' |
| customer.phones | ⚠️ Opcional | Formatado corretamente |
| items[].amount | ✅ | Centavos |
| items[].description | ✅ | String |
| items[].quantity | ✅ | Número |
| payments[].payment_method | ✅ | 'pix' |
| payments[].pix.expires_in | ✅ | 3600 segundos (1 hora) |
| metadata.church_id | ✅ | UUID |
| metadata.plan_id | ✅ | UUID |
| metadata.type | ✅ | 'annual_subscription' |

**Validações no frontend:**
- ✅ Nome obrigatório
- ✅ Email válido obrigatório
- ✅ CPF/CNPJ com mínimo 11 dígitos
- ✅ Formatação automática de CPF/CNPJ
- ✅ Formatação automática de telefone

---

## 4. Estrutura do Banco de Dados ✅

**Tabela `subscriptions`:**

| Coluna | Stripe | Pagar.me | Uso |
|--------|--------|----------|-----|
| id | ✅ | ✅ | PK |
| church_id | ✅ | ✅ | FK para churches |
| plan_id | ✅ | ✅ | FK para subscription_plans |
| stripe_subscription_id | ✅ | - | ID da assinatura no Stripe |
| stripe_customer_id | ✅ | - | ID do cliente no Stripe |
| pagarme_subscription_id | - | ✅ | ID da assinatura na Pagar.me |
| pagarme_customer_id | - | ✅ | ID do cliente na Pagar.me |
| pagarme_order_id | - | ✅ | ID do pedido PIX na Pagar.me |
| status | ✅ | ✅ | pending, active, past_due, canceled |
| current_period_start | ✅ | ✅ | Início do período |
| current_period_end | ✅ | ✅ | Fim do período |
| cancel_at_period_end | ✅ | - | Cancelamento agendado |
| canceled_at | ✅ | ✅ | Data de cancelamento |

**Tabela `subscription_invoices`:**

| Coluna | Stripe | Pagar.me | Uso |
|--------|--------|----------|-----|
| id | ✅ | ✅ | PK |
| subscription_id | ✅ | ✅ | FK para subscriptions |
| church_id | ✅ | ✅ | FK para churches |
| stripe_invoice_id | ✅ | - | ID da fatura no Stripe |
| stripe_payment_intent_id | ✅ | - | ID do pagamento no Stripe |
| pagarme_invoice_id | - | ✅ | ID do pedido na Pagar.me |
| amount_cents | ✅ | ✅ | Valor em centavos |
| status | ✅ | ✅ | pending, paid, failed, canceled |
| paid_at | ✅ | ✅ | Data de pagamento |
| payment_method | ✅ | ✅ | card, pix |
| due_date | - | ✅ | Data de vencimento PIX |
| pix_qr_code | - | ✅ | Código PIX copia-cola |

---

## 5. Fluxo de Ativação de Assinatura ✅

### Fluxo Stripe (Cartão)

```
1. Pastor clica "Pagar com Cartão"
2. handleSelectPlan() → redireciona para /checkout?plan=X
3. createCheckoutSession() → cria sessão Stripe
4. Stripe Checkout → pastor paga
5. Webhook: checkout.session.completed
6. Webhook: customer.subscription.created → cria subscription no DB
7. Webhook: invoice.paid → ativa subscription (status: active)
```

### Fluxo Pagar.me (PIX)

```
1. Pastor clica "Pagar com PIX"
2. Modal abre → preenche dados (nome, email, CPF)
3. createPixPaymentForAnnualPlan() → cria Order na Pagar.me
4. Retorna QR Code PIX
5. Pastor paga pelo app do banco
6. Polling: checkPixPaymentStatus() verifica a cada 5s
   OU
   Webhook: order.paid → ativa subscription
7. Subscription atualizada para status: active
```

---

## 6. Problemas Encontrados e Correções

### 6.1 Webhook Pagar.me sem verificação de assinatura

**Problema:** O webhook aceita qualquer requisição sem validar a origem.

**Correção necessária:** Implementar verificação HMAC usando o header `x-hub-signature`.

### 6.2 Falta de logging estruturado no webhook Pagar.me

**Problema:** Usa `console.log` que não é persistido.

**Correção necessária:** Usar o logger estruturado como no webhook do Stripe.

### 6.3 Falta de retry no webhook Pagar.me

**Problema:** Se o processamento falhar, não há retry automático.

**Correção necessária:** Usar `processWebhookWithRetry` como no Stripe.

---

## 7. Configurações Necessárias

### Variáveis de Ambiente

| Variável | Gateway | Obrigatório |
|----------|---------|-------------|
| STRIPE_SECRET_KEY | Stripe | ✅ |
| STRIPE_WEBHOOK_SECRET | Stripe | ✅ |
| PAGARME_SECRET_KEY | Pagar.me | ✅ |
| PAGARME_API_URL | Pagar.me | ⚠️ Default: https://api.pagar.me/core/v5 |

### Webhooks a Configurar

| Gateway | URL | Eventos |
|---------|-----|---------|
| Stripe | /api/webhooks/stripe | checkout.session.*, invoice.*, customer.subscription.* |
| Pagar.me | /api/webhooks/pagarme | order.paid, order.payment_failed, order.canceled |

---

## 8. Conclusão

A implementação está **funcional** e cobre os fluxos principais:
- ✅ Pagamento mensal via Stripe (cartão recorrente)
- ✅ Pagamento anual via Stripe (cartão recorrente)
- ✅ Pagamento anual via Pagar.me (PIX único)

**Melhorias recomendadas:**
1. Adicionar verificação de assinatura no webhook Pagar.me
2. Usar logger estruturado no webhook Pagar.me
3. Adicionar sistema de retry no webhook Pagar.me
