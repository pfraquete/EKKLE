'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
    createOrder as createPagarmeOrder,
    PagarmeOrder,
    createSplitRules,
    calculateSplitAmounts,
} from '@/lib/pagarme'

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createOfferingSchema = z.object({
    amount_cents: z.number().int().min(100, 'Valor mínimo é R$ 1,00'),
    payment_method: z.enum(['pix', 'credit_card']),
    card: z.object({
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
    }).optional(),
    customer: z.object({
        document: z.string().min(11),
    }),
})

type CreateOfferingInput = z.infer<typeof createOfferingSchema>

// =====================================================
// GET CELL BALANCE
// =====================================================

export async function getCellBalance() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (!profile.cell_id) {
        return { success: false, error: 'Você não está em uma célula' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_balance')
        .select('balance_cents')
        .eq('cell_id', profile.cell_id)
        .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching cell balance:', error)
        return { success: false, error: 'Erro ao buscar saldo' }
    }

    return {
        success: true,
        data: {
            balance_cents: data?.balance_cents || 0,
        }
    }
}

// =====================================================
// GET ALL CELL BALANCES (Pastor/Finance Team)
// =====================================================

export async function getAllCellBalances() {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Check if user is pastor or finance team
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_balance')
        .select(`
            *,
            cell:cells(
                id,
                name,
                leader:profiles!cells_leader_id_fkey(id, full_name, photo_url)
            )
        `)
        .eq('church_id', profile.church_id)
        .order('balance_cents', { ascending: false })

    if (error) {
        console.error('Error fetching cell balances:', error)
        return { success: false, error: 'Erro ao buscar saldos' }
    }

    // Calculate total
    const total = data?.reduce((sum, cb) => sum + cb.balance_cents, 0) || 0

    return {
        success: true,
        data: {
            cells: data || [],
            total_cents: total,
        }
    }
}

// =====================================================
// GET CELL OFFERINGS
// =====================================================

export async function getCellOfferings(limit?: number) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (!profile.cell_id) {
        return { success: false, error: 'Você não está em uma célula' }
    }

    const supabase = await createClient()

    let query = supabase
        .from('cell_offerings')
        .select(`
            *,
            profile:profiles(id, full_name, photo_url)
        `)
        .eq('cell_id', profile.cell_id)
        .order('created_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching cell offerings:', error)
        return { success: false, error: 'Erro ao buscar ofertas' }
    }

    return { success: true, data: data || [] }
}

// =====================================================
// CREATE CELL OFFERING (with Pagar.me payment)
// =====================================================

export async function createCellOffering(input: CreateOfferingInput) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    if (!profile.cell_id) {
        return { success: false, error: 'Você não está em uma célula' }
    }

    try {
        const validated = createOfferingSchema.parse(input)

        // Validate card for credit card payment
        if (validated.payment_method === 'credit_card' && !validated.card) {
            return { success: false, error: 'Dados do cartão são obrigatórios' }
        }

        const supabase = await createClient()

        // Get recipient configuration
        const { data: recipient } = await supabase
            .from('recipients')
            .select('*')
            .eq('church_id', profile.church_id)
            .single()

        if (!recipient || recipient.status !== 'active') {
            return {
                success: false,
                error: 'Igreja não configurada para receber pagamentos',
            }
        }

        // Get platform recipient ID
        const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID
        if (!platformRecipientId) {
            console.error('PAGARME_PLATFORM_RECIPIENT_ID not configured')
            return { success: false, error: 'Configuração de pagamento inválida' }
        }

        // Calculate split (1% platform, 99% church/cell)
        const splitRules = createSplitRules(
            validated.amount_cents,
            recipient.pagarme_recipient_id,
            platformRecipientId
        )
        const { platformFeeCents, churchAmountCents } = calculateSplitAmounts(validated.amount_cents)

        // Prepare customer data
        const cleanDocument = validated.customer.document.replace(/\D/g, '')
        const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ'
        const customerType = cleanDocument.length <= 11 ? 'individual' : 'company'

        // Create order in Pagar.me
        const pagarmeOrder: PagarmeOrder = {
            items: [{
                amount: validated.amount_cents,
                description: 'Oferta para Célula',
                quantity: 1,
            }],
            customer: {
                name: profile.full_name,
                email: profile.email || '',
                document: cleanDocument,
                document_type: documentType,
                type: customerType,
                phones: profile.phone ? {
                    mobile_phone: {
                        country_code: '55',
                        area_code: profile.phone.replace(/\D/g, '').substring(0, 2),
                        number: profile.phone.replace(/\D/g, '').substring(2),
                    },
                } : undefined,
            },
            payments: [{
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
                                    zip_code: validated.card.billingAddress.zipCode,
                                    city: validated.card.billingAddress.city,
                                    state: validated.card.billingAddress.state,
                                    country: 'BR',
                                },
                            },
                            installments: 1,
                            statement_descriptor: 'OFERTA CELULA',
                        },
                    }
                    : {
                        pix: {
                            expires_in: 3600, // 1 hour
                        },
                    }),
            }],
        }

        const pagarmeResponse = await createPagarmeOrder(pagarmeOrder)

        // Extract payment info
        const charge = pagarmeResponse.charges?.[0]
        const lastTransaction = charge?.last_transaction

        // Create offering record in database
        const { data: offering, error: insertError } = await supabase
            .from('cell_offerings')
            .insert({
                cell_id: profile.cell_id,
                church_id: profile.church_id,
                profile_id: profile.id,
                amount_cents: validated.amount_cents,
                payment_method: validated.payment_method,
                status: charge?.status === 'paid' ? 'PAID' : 'PENDING',
                pagarme_order_id: pagarmeResponse.id,
                pagarme_charge_id: charge?.id,
                pix_qr_code: lastTransaction?.qr_code,
                pix_qr_code_url: lastTransaction?.qr_code_url,
                pix_expires_at: lastTransaction?.expires_at,
                platform_fee_cents: platformFeeCents,
                cell_amount_cents: churchAmountCents,
                paid_at: charge?.status === 'paid' ? new Date().toISOString() : null,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating offering:', insertError)
            return { success: false, error: 'Erro ao criar oferta' }
        }

        revalidatePath('/membro/minha-celula/ofertas')

        return {
            success: true,
            data: {
                id: offering.id,
                status: offering.status,
                pix_qr_code: offering.pix_qr_code,
                pix_qr_code_url: offering.pix_qr_code_url,
                pix_expires_at: offering.pix_expires_at,
            }
        }
    } catch (error) {
        console.error('Error creating cell offering:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: 'Erro ao processar pagamento' }
    }
}

// =====================================================
// CHECK OFFERING STATUS (for polling PIX payments)
// =====================================================

export async function checkOfferingStatus(offeringId: string) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_offerings')
        .select('id, status, paid_at')
        .eq('id', offeringId)
        .single()

    if (error) {
        console.error('Error checking offering status:', error)
        return { success: false, error: 'Erro ao verificar status' }
    }

    return {
        success: true,
        data: {
            status: data.status,
            paid_at: data.paid_at,
        }
    }
}

// =====================================================
// GET CELL OFFERINGS BY CELL ID (Pastor/Finance Team)
// =====================================================

export async function getCellOfferingsByCellId(cellId: string, limit?: number) {
    const profile = await getProfile()
    if (!profile) {
        return { success: false, error: 'Não autenticado' }
    }

    // Check if user is pastor or finance team
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        return { success: false, error: 'Acesso não autorizado' }
    }

    const supabase = await createClient()

    let query = supabase
        .from('cell_offerings')
        .select(`
            *,
            profile:profiles(id, full_name, photo_url)
        `)
        .eq('cell_id', cellId)
        .eq('church_id', profile.church_id)
        .order('created_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching cell offerings:', error)
        return { success: false, error: 'Erro ao buscar ofertas' }
    }

    return { success: true, data: data || [] }
}
