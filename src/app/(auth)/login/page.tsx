import { signIn } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/buttons/submit-button'
import Link from 'next/link'



export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const { message, error } = await searchParams

    return (
        <div className="space-y-6">


            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
                <CardHeader className="space-y-1 bg-muted/50 border-b border-border">
                    <CardTitle className="text-xl font-bold text-foreground">Acesse sua conta</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Entre com seu email e senha para acessar sua célula
                    </CardDescription>
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
            </Card>
        </div>
    )
}
