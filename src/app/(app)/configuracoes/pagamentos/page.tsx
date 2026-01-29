import { getProfile } from '@/actions/auth'
import { getChurchRecipient } from '@/actions/recipients'
import { redirect } from 'next/navigation'
import { RecipientForm } from '@/components/recipients/recipient-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, CheckCircle, AlertCircle, Info, Building2 } from 'lucide-react'

export default async function PaymentsConfigPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')
    if (profile.role !== 'PASTOR') redirect('/dashboard')

    const { recipient } = await getChurchRecipient()

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground">Pagamentos</h1>
                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                    Configuração de conta bancária • Ekkle
                </p>
            </div>

            {/* Payment Split Info */}
            <Card className="border-none shadow-lg rounded-3xl bg-primary/5">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Info className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Como funciona o pagamento</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Todos os pagamentos são divididos automaticamente: <strong className="text-foreground">99% para a igreja</strong> e{' '}
                                <strong className="text-foreground">1% para a plataforma EKKLE</strong>. Os valores são transferidos diretamente para a conta
                                bancária cadastrada.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Card */}
            {recipient && recipient.status === 'active' ? (
                <Card className="border-none shadow-lg rounded-3xl bg-emerald-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground">Recebedor Configurado</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Sua igreja está pronta para receber pagamentos. Os valores serão transferidos para a conta
                                    cadastrada automaticamente.
                                </p>

                                {/* Bank Account Details */}
                                <div className="mt-4 p-4 bg-background rounded-2xl border border-border">
                                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-primary" />
                                        Dados Bancários
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 bg-muted/40 rounded-xl">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Banco</span>
                                            <p className="font-bold text-foreground mt-1">
                                                {recipient.bank_code}
                                                {recipient.bank_name && ` - ${recipient.bank_name}`}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-muted/40 rounded-xl">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Agência</span>
                                            <p className="font-bold text-foreground mt-1">
                                                {recipient.branch_number}
                                                {recipient.branch_digit && `-${recipient.branch_digit}`}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-muted/40 rounded-xl">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Conta</span>
                                            <p className="font-bold text-foreground mt-1">
                                                {recipient.account_number}-{recipient.account_digit} (
                                                {recipient.account_type === 'checking' ? 'Corrente' : 'Poupança'})
                                            </p>
                                        </div>
                                        <div className="p-3 bg-muted/40 rounded-xl">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Titular</span>
                                            <p className="font-bold text-foreground mt-1">{recipient.holder_name}</p>
                                        </div>
                                        <div className="p-3 bg-muted/40 rounded-xl md:col-span-2">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transferência</span>
                                            <p className="font-bold text-foreground mt-1">
                                                {recipient.transfer_interval === 'daily'
                                                    ? 'Diária'
                                                    : recipient.transfer_interval === 'weekly'
                                                    ? 'Semanal'
                                                    : 'Mensal'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-none shadow-lg rounded-3xl bg-amber-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Configuração Necessária</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Para receber pagamentos da loja e ofertas, você precisa cadastrar uma conta bancária.
                                    Preencha o formulário abaixo com os dados da conta que receberá os pagamentos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form Card */}
            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <Wallet className="w-5 h-5 text-primary" />
                        {recipient ? 'Atualizar Dados' : 'Cadastrar Conta Bancária'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RecipientForm recipient={recipient} />
                </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-none shadow-lg rounded-3xl bg-muted/30">
                <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4">Informações Importantes</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>
                                Os dados bancários são armazenados de forma segura pelo gateway de pagamento Pagar.me, em
                                conformidade com as normas do Banco Central.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>
                                Após configurar o recebedor, os dados bancários não poderão ser alterados. Para mudar de conta, será
                                necessário criar um novo recebedor.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>
                                O CPF/CNPJ do titular da conta deve ser o mesmo cadastrado na igreja ou de um representante legal.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>
                                As transferências são processadas automaticamente de acordo com o intervalo escolhido (diário,
                                semanal ou mensal).
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
