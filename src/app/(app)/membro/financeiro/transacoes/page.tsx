import { getProfile } from '@/actions/auth'
import { getTransactions, deleteTransaction } from '@/actions/finance'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
    ArrowLeft,
    Trash2,
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/dashboard/finance/transaction-form'

export default async function MemberTransacoesPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: 'INCOME' | 'EXPENSE'; category?: string }>
}) {
    const profile = await getProfile()

    if (!profile || (profile.role !== 'PASTOR' && !profile.is_finance_team)) {
        redirect('/membro')
    }

    const { type, category } = await searchParams
    const result = await getTransactions({ type, category })
    const transactions = result.success && result.data ? result.data : []

    // Calculate totals
    const totalIncome = transactions
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + tx.amount_cents, 0)
    const totalExpense = transactions
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + tx.amount_cents, 0)

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <Link
                    href="/membro/financeiro"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-black text-foreground">Transações</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Histórico completo de lançamentos • Ekkle
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <TransactionForm defaultType="INCOME" />
                <TransactionForm defaultType="EXPENSE" />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Entradas</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600">
                        {formatCurrency(totalIncome / 100)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-red-500/10">
                            <ArrowDownCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Saídas</span>
                    </div>
                    <p className="text-xl font-black text-red-600">
                        {formatCurrency(totalExpense / 100)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <History className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Total</span>
                    </div>
                    <p className="text-xl font-black text-foreground">{transactions.length}</p>
                </div>
            </div>

            {/* Transactions List */}
            {transactions.length === 0 ? (
                <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhuma transação encontrada
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Comece adicionando uma entrada ou saída
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-border">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            tx.type === 'INCOME'
                                                ? 'bg-emerald-500/10'
                                                : 'bg-red-500/10'
                                        }`}
                                    >
                                        {tx.type === 'INCOME' ? (
                                            <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <ArrowDownCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {tx.description || tx.category}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span>•</span>
                                            <span>{tx.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`font-black text-lg ${
                                            tx.type === 'INCOME'
                                                ? 'text-emerald-500'
                                                : 'text-red-500'
                                        }`}
                                    >
                                        {tx.type === 'INCOME' ? '+' : '-'}
                                        {formatCurrency(tx.amount_cents / 100)}
                                    </span>
                                    <form
                                        action={async () => {
                                            'use server'
                                            await deleteTransaction(tx.id)
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-600 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
