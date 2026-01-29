import { getFinancialSummary, getTransactions } from '@/actions/finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Wallet, History, Search, ShoppingBag, Heart, HandCoins, Users, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function FinanceDashboardPage() {
    const summaryResult = await getFinancialSummary()
    const transactionsResult = await getTransactions({ limit: 5 })

    const summary = summaryResult.success && summaryResult.data
        ? summaryResult.data
        : { income: 0, expense: 0, balance: 0, breakdown: { donations: 0, shopRevenue: 0, expenses: 0, ordersCount: 0 } }
    const breakdown = summary.breakdown || { donations: 0, shopRevenue: 0, expenses: 0, ordersCount: 0 }
    const transactions = transactionsResult.success && transactionsResult.data
        ? transactionsResult.data
        : []

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                    <p className="text-muted-foreground">Gestão de dízimos, ofertas, vendas e despesas.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="flex-1 sm:flex-none">
                        <Link href="/dashboard/financeiro/transacoes">
                            <History className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Ver Tudo</span>
                            <span className="sm:hidden">Todos</span>
                        </Link>
                    </Button>
                    <Button asChild className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                        <Link href="/dashboard/financeiro/transacoes?type=INCOME">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Nova Entrada</span>
                            <span className="sm:hidden">Entrada</span>
                        </Link>
                    </Button>
                    <Button asChild variant="destructive" className="flex-1 sm:flex-none">
                        <Link href="/dashboard/financeiro/transacoes?type=EXPENSE">
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Nova Despesa</span>
                            <span className="sm:hidden">Despesa</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link
                    href="/dashboard/financeiro/dizimos"
                    className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <HandCoins className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Dízimos</h3>
                            <p className="text-sm text-muted-foreground">
                                Confirmar comprovantes
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                    href="/dashboard/financeiro/celulas"
                    className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Caixa das Células</h3>
                            <p className="text-sm text-muted-foreground">
                                Saldo de cada célula
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                    href="/dashboard/financeiro/equipe"
                    className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                            <UserPlus className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Equipe Financeira</h3>
                            <p className="text-sm text-muted-foreground">
                                Gerenciar acessos
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                        <ArrowUpCircle className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.income / 100)}</div>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Saídas</CardTitle>
                        <ArrowDownCircle className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatCurrency(summary.expense / 100)}</div>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                        <Wallet className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-700'}`}>
                            {formatCurrency(summary.balance / 100)}
                        </div>
                        <p className="text-xs text-muted-foreground">Líquido disponível</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Sections */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Recent Transactions */}
                <Card className="shadow-xl border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Últimos Lançamentos</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/financeiro/transacoes">Ver Mais</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                Nenhuma transação recente.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {tx.type === 'INCOME' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm leading-none">{tx.description || tx.category}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount_cents / 100)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card className="shadow-xl border-none">
                    <CardHeader>
                        <CardTitle className="text-xl">Composição da Receita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Donations */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-200/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Dízimos e Ofertas</p>
                                    <p className="text-xs text-muted-foreground">Lançamentos manuais</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-purple-700">{formatCurrency(breakdown.donations / 100)}</p>
                            </div>
                        </div>

                        {/* Shop Revenue */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-200/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Vendas da Loja</p>
                                    <p className="text-xs text-muted-foreground">{breakdown.ordersCount} pedido{breakdown.ordersCount !== 1 ? 's' : ''} pago{breakdown.ordersCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-blue-700">{formatCurrency(breakdown.shopRevenue / 100)}</p>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-200/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-100 text-red-700">
                                    <ArrowDownCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Despesas</p>
                                    <p className="text-xs text-muted-foreground">Saídas registradas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-red-700">-{formatCurrency(breakdown.expenses / 100)}</p>
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Saldo Líquido</span>
                                <span className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(summary.balance / 100)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
