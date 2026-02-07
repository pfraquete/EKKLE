import { getTransactions, deleteTransaction } from '@/actions/finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/components/dashboard/finance/transaction-form'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: 'INCOME' | 'EXPENSE'; category?: string }>
}) {
    const { type, category } = await searchParams
    const result = await getTransactions({ type, category })
    const transactions = result.success && result.data ? result.data : []

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/dashboard/financeiro">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Lançamentos Detalhados</h1>
                </div>
                <div className="flex gap-2">
                    <TransactionForm defaultType="INCOME" />
                    <TransactionForm defaultType="EXPENSE" />
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-0">
                    {transactions.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Nenhum lançamento encontrado para os filtros selecionados.
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Card list */}
                            <div className="md:hidden divide-y divide-border">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`p-2 rounded-lg flex-shrink-0 ${tx.type === 'INCOME' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                {tx.type === 'INCOME' ? <ArrowUpCircle className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-600" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{tx.description || tx.category}</p>
                                                <p className="text-xs text-muted-foreground">{tx.category} &middot; {new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`font-bold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount_cents / 100)}
                                            </span>
                                            <form action={async () => {
                                                'use server'
                                                await deleteTransaction(tx.id)
                                            }}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Data</th>
                                            <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Descrição / Categoria</th>
                                            <th className="text-left px-6 py-4 font-semibold uppercase tracking-wider text-xs">Tipo</th>
                                            <th className="text-right px-6 py-4 font-semibold uppercase tracking-wider text-xs">Valor</th>
                                            <th className="text-center px-6 py-4 font-semibold uppercase tracking-wider text-xs">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold">{tx.description || tx.category}</div>
                                                    <div className="text-xs text-muted-foreground">{tx.category}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`flex items-center gap-1.5 font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'INCOME' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                                        {tx.type === 'INCOME' ? 'Entrada' : 'Saída'}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount_cents / 100)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <form action={async () => {
                                                        'use server'
                                                        await deleteTransaction(tx.id)
                                                    }}>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
