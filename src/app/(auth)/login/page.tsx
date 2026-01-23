import { signIn } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/buttons/submit-button'
import Link from 'next/link'
import Image from 'next/image'
import { getChurch } from '@/lib/get-church'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const { message, error } = await searchParams
    const church = await getChurch()

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
                <CardHeader className="space-y-1 bg-muted/50 border-b border-border text-center">
                    {church ? (
                        <div className="flex flex-col items-center gap-3 mb-2">
                            {church.logo_url && (
                                <Image
                                    src={church.logo_url}
                                    alt={church.name}
                                    width={64}
                                    height={64}
                                    className="object-contain"
                                />
                            )}
                            <CardTitle className="text-xl font-bold text-foreground">
                                {church.name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Área de Membros
                            </CardDescription>
                        </div>
                    ) : (
                        <>
                            <CardTitle className="text-xl font-bold text-foreground">Acesse sua conta</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Entre com seu email e senha para acessar sua célula
                            </CardDescription>
                        </>
                    )}
                </CardHeader>
                <CardContent>
                    {message && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="exemplo@ekkle.com"
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                required
                                className="h-11"
                            />
                        </div>

                        <SubmitButton formAction={signIn} className="w-full h-11 text-base font-semibold">
                            Entrar
                        </SubmitButton>
                    </form>
                </CardContent>
                <div className="p-4 bg-muted/30 text-center text-sm border-t border-border">
                    Não tem uma conta?{' '}
                    <Link href="/registro" className="text-primary hover:underline font-semibold">
                        Criar conta
                    </Link>
                </div>
            </Card>
        </div>
    )
}
