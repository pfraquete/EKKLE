'use server';

import { createClient } from '@/lib/supabase/server';
import { getProfile } from './auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createOrder as createPagarmeOrder,
  PagarmeOrder,
  PagarmeCard,
  createSplitRules,
  calculateSplitAmounts,
  PagarmeError,
} from '@/lib/pagarme';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, 'Adicione pelo menos um item ao carrinho'),
  customer: z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    document: z.string().min(11, 'CPF/CNPJ inválido'),
  }),
  payment_method: z.enum(['credit_card', 'pix']),
  card: z
    .object({
      number: z.string().min(13),
      holderName: z.string().min(1),
      expMonth: z.number().int().min(1).max(12),
      expYear: z.number().int().min(2024),
      cvv: z.string().min(3).max(4),
      billingAddress: z.object({
        line1: z.string().min(1),
        zipCode: z.string().min(8),
        city: z.string().min(1),
        state: z.string().length(2),
      }),
    })
    .optional(),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

// =====================================================
// CREATE CHECKOUT ORDER
// Main function for processing checkout with Pagar.me split payment
// =====================================================

export async function createCheckoutOrder(input: CheckoutInput) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Não autenticado' };
    }

    const validated = checkoutSchema.parse(input);

    // Validate card is required for credit card payment
    if (validated.payment_method === 'credit_card' && !validated.card) {
      return { success: false, error: 'Dados do cartão são obrigatórios' };
    }

    const supabase = await createClient();

    // ===== 1. CHECK RECIPIENT CONFIGURATION =====
    const { data: recipient } = await supabase
      .from('recipients')
      .select('*')
      .eq('church_id', profile.church_id)
      .single();

    if (!recipient || recipient.status !== 'active') {
      return {
        success: false,
        error: 'Loja não configurada para receber pagamentos. Entre em contato com a administração.',
      };
    }

    // Get platform recipient ID from environment
    const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
    if (!platformRecipientId) {
      console.error('PAGARME_PLATFORM_RECIPIENT_ID not configured');
      return { success: false, error: 'Configuração de pagamento inválida' };
    }

    // ===== 2. FETCH PRODUCTS AND VALIDATE STOCK =====
    const productIds = validated.items.map((item) => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'active');

    if (!products || products.length !== productIds.length) {
      return { success: false, error: 'Alguns produtos não estão disponíveis' };
    }

    // Check inventory
    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;

      if (product.track_inventory && !product.allow_backorder) {
        if (product.stock_quantity < item.quantity) {
          return {
            success: false,
            error: `${product.name} não tem estoque suficiente. Disponível: ${product.stock_quantity}`,
          };
        }
      }
    }

    // ===== 3. CALCULATE ORDER TOTALS =====
    let subtotalCents = 0;
    const orderItems = validated.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      const totalCents = product.price_cents * item.quantity;
      subtotalCents += totalCents;

      return {
        product_id: item.product_id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price_cents: product.price_cents,
        quantity: item.quantity,
        total_cents: totalCents,
      };
    });

    const totalCents = subtotalCents; // Add shipping/discount logic here if needed

    // ===== 4. CREATE SPLIT RULES (1% platform, 99% church) =====
    const splitRules = createSplitRules(totalCents, recipient.pagarme_recipient_id, platformRecipientId);
    const { platformFeeCents, churchAmountCents } = calculateSplitAmounts(totalCents);

    console.log('Split amounts:', {
      total: totalCents,
      platform: platformFeeCents,
      church: churchAmountCents,
    });

    // ===== 5. PREPARE CUSTOMER DATA =====
    const cleanDocument = validated.customer.document.replace(/\D/g, '');
    const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ';
    const customerType = cleanDocument.length <= 11 ? 'individual' : 'company';

    const cleanPhone = validated.customer.phone.replace(/\D/g, '');

    // ===== 6. CREATE ORDER IN PAGAR.ME =====
    const pagarmeOrder: PagarmeOrder = {
      items: orderItems.map((item) => ({
        amount: item.total_cents,
        description: item.product_name,
        quantity: item.quantity,
        code: item.product_sku || undefined,
      })),
      customer: {
        name: validated.customer.name,
        email: validated.customer.email,
        document: cleanDocument,
        document_type: documentType,
        type: customerType,
        phones:
          cleanPhone.length >= 10
            ? {
                mobile_phone: {
                  country_code: '55',
                  area_code: cleanPhone.substring(0, 2),
                  number: cleanPhone.substring(2),
                },
              }
            : undefined,
      },
      payments: [
        {
          payment_method: validated.payment_method,
          split: splitRules,
          ...(validated.payment_method === 'credit_card' && validated.card
            ? {
                credit_card: {
                  card: {
                    number: validated.card.number.replace(/\s/g, ''),
                    holder_name: validated.card.holderName,
                    exp_month: validated.card.expMonth,
                    exp_year: validated.card.expYear,
                    cvv: validated.card.cvv,
                    billing_address: {
                      line_1: validated.card.billingAddress.line1,
                      zip_code: validated.card.billingAddress.zipCode.replace(/\D/g, ''),
                      city: validated.card.billingAddress.city,
                      state: validated.card.billingAddress.state,
                      country: 'BR',
                    },
                  } as PagarmeCard,
                  installments: 1,
                },
              }
            : {}),
          ...(validated.payment_method === 'pix'
            ? {
                pix: {
                  expires_in: 3600, // 1 hour
                },
              }
            : {}),
        },
      ],
      metadata: {
        church_id: profile.church_id,
        customer_id: profile.id,
      },
      closed: true,
    };

    console.log('Creating order in Pagar.me...');
    const pagarmeResponse = await createPagarmeOrder(pagarmeOrder);
    console.log('Pagar.me order created:', pagarmeResponse.id);

    // ===== 7. CREATE ORDER IN DATABASE =====
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        church_id: profile.church_id,
        customer_id: profile.id,
        customer_name: validated.customer.name,
        customer_email: validated.customer.email,
        customer_phone: validated.customer.phone,
        customer_document: cleanDocument,
        pagarme_order_id: pagarmeResponse.id,
        pagarme_customer_id: pagarmeResponse.customer.id,
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        payment_method: validated.payment_method,
        payment_status: pagarmeResponse.status === 'paid' ? 'paid' : 'pending',
        status: pagarmeResponse.status === 'paid' ? 'processing' : 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order in database:', orderError);
      return { success: false, error: 'Erro ao criar pedido' };
    }

    console.log('Order created in database:', order.id);

    // ===== 8. CREATE ORDER ITEMS =====
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }))
    );

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }

    // ===== 9. CREATE PAYMENT RECORD =====
    const charge = pagarmeResponse.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    const { error: paymentError } = await supabase.from('order_payments').insert({
      order_id: order.id,
      pagarme_charge_id: charge?.id,
      pagarme_transaction_id: lastTransaction?.id,
      amount_cents: totalCents,
      payment_method: validated.payment_method,
      status: charge?.status === 'paid' ? 'paid' : 'pending',
      platform_fee_cents: platformFeeCents,
      church_amount_cents: churchAmountCents,
      card_brand: validated.payment_method === 'credit_card' ? 'unknown' : undefined,
      pix_qr_code: lastTransaction?.qr_code,
      pix_qr_code_url: lastTransaction?.qr_code_url,
      pix_expires_at: lastTransaction?.expires_at,
      paid_at: charge?.paid_at,
    });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    // ===== 10. REVALIDATE PATHS =====
    revalidatePath('/membro/loja');
    revalidatePath('/membro/pedidos');

    return {
      success: true,
      order,
      payment: {
        pix_qr_code: lastTransaction?.qr_code,
        pix_qr_code_url: lastTransaction?.qr_code_url,
      },
    };
  } catch (error) {
    console.error('Error creating checkout order:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof PagarmeError) {
      const errorMessage =
        error.data?.errors?.[0]?.message || error.data?.message || 'Erro no pagamento';
      return { success: false, error: errorMessage };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Erro ao processar pedido' };
  }
}

// =====================================================
// GET CUSTOMER ORDERS
// =====================================================

export async function getCustomerOrders() {
  try {
    const profile = await getProfile();
    if (!profile) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items(
          *,
          product:products(name, slug)
        ),
        payments:order_payments(*)
      `
      )
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}

// =====================================================
// GET SINGLE ORDER
// =====================================================

export async function getOrder(orderId: string) {
  try {
    const profile = await getProfile();
    if (!profile) return null;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items(*),
        payments:order_payments(*)
      `
      )
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    // Verify access (customer or church member)
    if (data.customer_id !== profile.id && data.church_id !== profile.church_id) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

// =====================================================
// GET CHURCH ORDERS (Pastor View)
// =====================================================

export async function getChurchOrders() {
  try {
    const profile = await getProfile();
    if (!profile) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items(*),
        payments:order_payments(*)
      `
      )
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching church orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching church orders:', error);
    return [];
  }
}

// =====================================================
// UPDATE ORDER STATUS (Pastor Only)
// =====================================================

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, church_id')
      .eq('id', orderId)
      .single();

    if (!order || order.church_id !== profile.church_id) {
      return { success: false, error: 'Pedido não encontrado' };
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Erro ao atualizar status do pedido' };
    }

    revalidatePath('/dashboard/loja/pedidos');

    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: 'Erro ao atualizar status do pedido' };
  }
}

// =====================================================
// UPDATE FULFILLMENT STATUS (Pastor Only)
// =====================================================

export async function updateFulfillmentStatus(orderId: string, fulfillmentStatus: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, church_id')
      .eq('id', orderId)
      .single();

    if (!order || order.church_id !== profile.church_id) {
      return { success: false, error: 'Pedido não encontrado' };
    }

    const updateData: { fulfillment_status: string; fulfilled_at?: string } = {
      fulfillment_status: fulfillmentStatus,
    };

    if (fulfillmentStatus === 'fulfilled') {
      updateData.fulfilled_at = new Date().toISOString();
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);

    if (error) {
      console.error('Error updating fulfillment status:', error);
      return { success: false, error: 'Erro ao atualizar status de entrega' };
    }

    revalidatePath('/dashboard/loja/pedidos');

    return { success: true };
  } catch (error) {
    console.error('Error updating fulfillment status:', error);
    return { success: false, error: 'Erro ao atualizar status de entrega' };
  }
}

// =====================================================
// GET ORDER STATISTICS (Pastor Only)
// =====================================================

export async function getOrderStatistics() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return null;
    }

    const supabase = await createClient();

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id);

    // Get paid orders
    const { count: paidOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .eq('payment_status', 'paid');

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_cents')
      .eq('church_id', profile.church_id)
      .eq('payment_status', 'paid');

    const totalRevenueCents = revenueData?.reduce((sum, order) => sum + order.total_cents, 0) || 0;

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .eq('payment_status', 'pending');

    return {
      totalOrders: totalOrders || 0,
      paidOrders: paidOrders || 0,
      totalRevenueCents,
      pendingOrders: pendingOrders || 0,
    };
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return null;
  }
}
