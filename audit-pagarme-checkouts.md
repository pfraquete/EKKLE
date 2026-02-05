# Auditoria de Checkouts Pagar.me - Split de Pagamentos

## Checkouts Identificados

| Arquivo | Função | Tipo | Split Implementado |
|---------|--------|------|-------------------|
| `actions/orders.ts` | `createCheckoutOrder` | Loja/Produtos | ✅ SIM |
| `actions/cell-offerings.ts` | `createOfferingPayment` | Ofertas de Célula | ✅ SIM |
| `actions/subscriptions.ts` | `createPixPaymentForAnnualPlan` | Assinatura PIX | ❌ NÃO |

---

## Detalhes por Checkout

### 1. Loja/Produtos (`actions/orders.ts`) ✅

**Função:** `createCheckoutOrder`

**Split implementado:**
```typescript
const splitRules = createSplitRules(totalCents, recipient.pagarme_recipient_id, platformRecipientId);
const { platformFeeCents, churchAmountCents } = calculateSplitAmounts(totalCents);
```

**Verificações:**
- ✅ Busca recipient da igreja
- ✅ Busca platformRecipientId do ambiente
- ✅ Usa createSplitRules (1% sistema, 99% igreja)
- ✅ Passa split nas payments

---

### 2. Ofertas de Célula (`actions/cell-offerings.ts`) ✅

**Função:** `createOfferingPayment`

**Split implementado:**
```typescript
const splitRules = createSplitRules(
    validated.amount_cents,
    recipient.pagarme_recipient_id,
    platformRecipientId
)
const { platformFeeCents, churchAmountCents } = calculateSplitAmounts(validated.amount_cents)
```

**Verificações:**
- ✅ Busca recipient da igreja
- ✅ Busca platformRecipientId do ambiente
- ✅ Usa createSplitRules (1% sistema, 99% igreja)
- ✅ Passa split nas payments

---

### 3. Assinatura PIX (`actions/subscriptions.ts`) ❌

**Função:** `createPixPaymentForAnnualPlan`

**Split NÃO implementado:**
```typescript
payments: [
  {
    payment_method: 'pix',
    pix: {
      expires_in: 3600,
      additional_information: [...],
    },
    // ❌ FALTA: split: splitRules
  },
],
```

**Problema:** O pagamento PIX da assinatura anual não tem split configurado. Todo o valor vai para a conta padrão da Pagar.me.

**Correção necessária:** Adicionar split rules ao pagamento PIX.

---

## Funções de Split (`lib/pagarme.ts`)

```typescript
export function calculateSplitAmounts(totalCents: number): {
  platformFeeCents: number;
  churchAmountCents: number;
} {
  // 1% platform fee, 99% to church
  const platformFeeCents = Math.floor(totalCents * 0.01);
  const churchAmountCents = totalCents - platformFeeCents;

  return {
    platformFeeCents,
    churchAmountCents,
  };
}

export function createSplitRules(
  totalCents: number,
  churchRecipientId: string,
  platformRecipientId: string
): PagarmeSplitRule[] {
  // Returns array with 1% to platform, 99% to church
}
```

---

## Ação Necessária

1. ❌ **Corrigir `createPixPaymentForAnnualPlan`** - Adicionar split rules

**NOTA:** Para assinaturas, o split pode não ser necessário se o valor vai diretamente para a conta do EKKLE (sistema), já que é pagamento da assinatura do próprio sistema, não um pagamento da igreja recebendo de membros.

**Verificar com o usuário:** O PIX da assinatura anual deve ter split? Ou o valor total vai para o EKKLE?
