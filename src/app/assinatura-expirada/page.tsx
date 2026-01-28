import { getProfile } from '@/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function AssinaturaExpiradaPage() {
    const profile = await getProfile()

    const isPastor = profile?.role === 'PASTOR'

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full border-none shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-black">Assinatura Expirada</CardTitle>
                    <CardDescription>
                        {isPastor
                            ? 'Sua assinatura do Ekkle expirou. Renove agora para continuar usando o sistema.'
                            : 'A assinatura da igreja expirou. Entre em contato com o pastor para renovar.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isPastor ? (
                        <>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    <strong>Atenção:</strong> Todos os membros da sua igreja estão sem acesso ao sistema até que a assinatura seja renovada.
                                </p>
                            </div>

                            <Link href="/configuracoes/assinatura" className="block">
                                <Button className="w-full rounded-2xl" size="lg">
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    Renovar Assinatura
                                </Button>
                            </Link>

                            <p className="text-xs text-center text-muted-foreground">
                                Ao renovar, o acesso será restaurado imediatamente para todos os membros.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Você não tem permissão para renovar a assinatura. Apenas o pastor pode fazer isso.
                                </p>
                            </div>

                            <Button variant="outline" className="w-full rounded-2xl" size="lg" disabled>
                                <Mail className="h-5 w-5 mr-2" />
                                Entre em contato com o pastor
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Assim que a assinatura for renovada, você terá acesso novamente.
                            </p>
                        </>
                    )}

                    <div className="pt-4 border-t">
                        <Link href="/logout">
                            <Button variant="ghost" className="w-full">
                                Sair
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
