'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1, 'Categoria é obrigatória'),
    amount_cents: z.number().min(1, 'Valor deve ser maior que zero'),
    description: z.string().optional(),
    date: z.string().min(1, 'Data é obrigatória'),
    status: z.enum(['PENDING', 'PAID', 'CANCELLED']).default('PAID'),
    member_id: z.string().uuid().optional().nullable(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

export async function getFinancialSummary(startDate?: string, endDate?: string) {
    try {
        const profile = await getProfile()
        if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) throw new Error('Não autorizado')

        const supabase = await createClient()

        // Get financial transactions
        let transactionsQuery = supabase
            .from('financial_transactions')
            .select('type, amount_cents')
            .eq('church_id', profile.church_id)
            .eq('status', 'PAID')

        if (startDate) transactionsQuery = transactionsQuery.gte('date', startDate)
        if (endDate) transactionsQuery = transactionsQuery.lte('date', endDate)

        const { data: transactionsData, error: transactionsError } = await transactionsQuery

        if (transactionsError) throw transactionsError

        // Get paid orders (shop revenue)
        let ordersQuery = supabase
            .from('orders')
            .select('total_cents, created_at')
            .eq('church_id', profile.church_id)
            .eq('payment_status', 'paid')

        if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate)
        if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate)

        const { data: ordersData, error: ordersError } = await ordersQuery

        if (ordersError) throw ordersError

        // Calculate transactions summary
        const transactionsSummary = (transactionsData || []).reduce(
            (acc, curr) => {
                if (curr.type === 'INCOME') acc.income += curr.amount_cents
                else acc.expense += curr.amount_cents
                return acc
            },
            { income: 0, expense: 0 }
        )

        // Calculate shop revenue
        const shopRevenue = (ordersData || []).reduce((sum, order) => sum + order.total_cents, 0)

        // Combined totals
        const totalIncome = transactionsSummary.income + shopRevenue
        const totalExpense = transactionsSummary.expense

        return {
            success: true,
            data: {
                income: totalIncome,
                expense: totalExpense,
                balance: totalIncome - totalExpense,
                // Breakdown for detailed view
                breakdown: {
                    donations: transactionsSummary.income,
                    shopRevenue: shopRevenue,
                    expenses: transactionsSummary.expense,
                    ordersCount: ordersData?.length || 0,
                },
            },
        }
    } catch (error) {
        console.error('Error fetching financial summary:', error)
        return { success: false, error: 'Erro ao buscar resumo financeiro' }
    }
}

export async function getTransactions(options?: {
    type?: 'INCOME' | 'EXPENSE'
    category?: string
    limit?: number
    offset?: number
}) {
    try {
        const profile = await getProfile()
        if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) throw new Error('Não autorizado')

        const supabase = await createClient()
        let query = supabase
            .from('financial_transactions')
            .select('*, profiles(full_name)')
            .eq('church_id', profile.church_id)
            .order('date', { ascending: false })

        if (options?.type) query = query.eq('type', options.type)
        if (options?.category) query = query.eq('category', options.category)
        if (options?.limit) query = query.limit(options.limit)
        if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)

        const { data, error } = await query
        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return { success: false, error: 'Erro ao buscar transações' }
    }
}

export async function createTransaction(data: TransactionInput) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') throw new Error('Não autorizado')

        const validated = transactionSchema.parse(data)
        const supabase = await createClient()

        const { error } = await supabase.from('financial_transactions').insert({
            ...validated,
            church_id: profile.church_id,
            date: new Date(validated.date).toISOString(),
        })

        if (error) throw error

        revalidatePath('/dashboard/financeiro')
        return { success: true }
    } catch (error) {
        console.error('Error creating transaction:', error)
        return { success: false, error: 'Erro ao criar lançamento' }
    }
}

export async function deleteTransaction(id: string) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') throw new Error('Não autorizado')

        const supabase = await createClient()
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath('/dashboard/financeiro')
        return { success: true }
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return { success: false, error: 'Erro ao excluir lançamento' }
    }
}
