# Auditoria de Checkouts com Split (1% Sistema / 99% Igreja)

## Checkouts Existentes

| Módulo | Arquivo | Split Implementado | Status |
|--------|---------|-------------------|--------|
| Loja/Produtos | `actions/orders.ts` | ✅ SIM | OK |
| Ofertas de Célula | `actions/cell-offerings.ts` | ✅ SIM | OK |
| Assinatura PIX | `actions/subscriptions.ts` | N/A (100% sistema) | OK |

## Checkouts que Precisam ser Criados

| Módulo | Campo is_paid | Checkout Existente | Ação Necessária |
|--------|---------------|-------------------|-----------------|
| Cursos Pagos | ✅ `courses.is_paid` | ❌ NÃO | Criar checkout |
| Eventos Pagos | ✅ `events.is_paid` | ❌ NÃO | Criar checkout |
| Caixas de Células | N/A | ✅ Já existe (cell-offerings.ts) | OK |

---

## Análise Detalhada

### 1. Cursos Pagos (`courses-admin.ts`)

**Campos existentes:**
- `is_paid: boolean` - Indica se o curso é pago
- `price_cents: number` - Preço em centavos

**Verificação de pagamento em `courses.ts`:**
```typescript
if (course.is_paid) {
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', profile.id)
    .eq('payment_status', 'paid')
```

**Status:** Verifica pagamento via tabela `orders`, mas não há checkout específico para cursos.

**Ação:** Criar checkout para cursos pagos com split 1%/99%.

---

### 2. Eventos Pagos (`events.ts`)

**Campos existentes:**
- `is_paid: boolean` - Indica se o evento é pago
- `price: number | null` - Preço do evento

**Verificação em `event-registrations.ts`:**
```typescript
if (event.is_paid) {
  return { success: false, error: 'Pagamento obrigatório...' }
}
```

**Status:** Bloqueia inscrição se evento é pago, mas não há checkout implementado.

**Ação:** Criar checkout para eventos pagos com split 1%/99%.

---

### 3. Caixas de Células (`cell-offerings.ts`)

**Status:** ✅ Checkout já implementado com split correto.

```typescript
const splitRules = createSplitRules(
    validated.amount_cents,
    recipient.pagarme_recipient_id,
    platformRecipientId
)
```

---

## Plano de Implementação

1. **Criar `actions/course-payments.ts`**
   - Função `createCoursePayment(courseId, paymentMethod, card?)`
   - Usar split 1% sistema / 99% igreja
   - Salvar em tabela `course_payments` ou usar `orders`

2. **Criar `actions/event-payments.ts`**
   - Função `createEventPayment(eventId, paymentMethod, card?)`
   - Usar split 1% sistema / 99% igreja
   - Atualizar `event_registrations.payment_status`

3. **Criar páginas de checkout**
   - `/cursos/[id]/checkout`
   - `/eventos/[id]/checkout`

4. **Atualizar webhooks**
   - Processar confirmação de pagamento de cursos
   - Processar confirmação de pagamento de eventos
