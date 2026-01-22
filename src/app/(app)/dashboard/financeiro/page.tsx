import { getFinancialSummary, getTransactions } from '@/actions/finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Wallet, History, Search } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function FinanceDashboardPage() {
    const summaryResult = await getFinancialSummary()
    const transactionsResult = await getTransactions({ limit: 5 })

    const summary = summaryResult.success && summaryResult.data
        ? summaryResult.data
        : { income: 0, expense: 0, balance: 0 }
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
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/financeiro/transacoes">
                            <History className="w-4 h-4 mr-2" />
                            Ver Tudo
                        </Link>
                    </Button>
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link href="/dashboard/financeiro/transacoes?type=INCOME">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Nova Entrada
                        </Link>
                    </Button>
                    <Button asChild variant="destructive">
                        <Link href="/dashboard/financeiro/transacoes?type=EXPENSE">
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Nova Despesa
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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
            <div className="grid gap-6 md:grid-cols-2">
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

                {/* Charts or Stats (Placeholder for now) */}
                <Card className="shadow-xl border-none flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                        <History className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">Distribuição por Categoria</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px]">
                        Gráficos e relatórios detalhados estarão disponíveis em breve conforme os lançamentos aumentarem.
                    </p>
                </Card>
            </div>
        </div>
    )
}
