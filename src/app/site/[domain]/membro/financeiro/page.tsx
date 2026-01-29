import { getProfile } from '@/actions/auth'
import { getFinancialSummary, getTransactions } from '@/actions/finance'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpCircle, ArrowDownCircle, Wallet, History, Search, ShoppingBag, Heart, HandCoins, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function MemberFinanceDashboardPage() {
    const profile = await getProfile()
    if (!profile) redirect('/entrar')

    // Only PASTOR or finance_team can access
    if (profile.role !== 'PASTOR' && !profile.is_finance_team) {
        redirect('/membro')
    }

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
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-foreground">Financeiro</h1>
                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                    Gestão de dízimos, ofertas e despesas • Ekkle
                </p>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link
                    href="/membro/financeiro/dizimos"
                    className="flex items-center justify-between p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all group"
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
                    href="/membro/financeiro/celulas"
                    className="flex items-center justify-between p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all group"
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
                    href="/membro/financeiro/transacoes"
                    className="flex items-center justify-between p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                            <History className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Transações</h3>
                            <p className="text-sm text-muted-foreground">
                                Histórico completo
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                        <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">{formatCurrency(summary.income / 100)}</div>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Saídas</CardTitle>
                        <ArrowDownCircle className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">{formatCurrency(summary.expense / 100)}</div>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                        <Wallet className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-black ${summary.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                            {formatCurrency(summary.balance / 100)}
                        </div>
                        <p className="text-xs text-muted-foreground">Líquido disponível</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Transactions */}
                <Card className="shadow-lg border-none rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold">Últimos Lançamentos</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/membro/financeiro/transacoes">Ver Mais</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                Nenhuma transação recente.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {tx.type === 'INCOME' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm leading-none">{tx.description || tx.category}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount_cents / 100)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card className="shadow-lg border-none rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Composição da Receita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Donations */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-200/30">
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
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-200/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Vendas da Loja</p>
                                    <p className="text-xs text-muted-foreground">{breakdown.ordersCount} pedido{breakdown.ordersCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-blue-700">{formatCurrency(breakdown.shopRevenue / 100)}</p>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-200/30">
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
                                <span className={`text-xl font-black ${summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
