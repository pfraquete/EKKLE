
import { forgotPassword } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/buttons/submit-button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const { message, error } = await searchParams

    return (
        <Card className="border-none shadow-xl w-full max-w-md">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                </div>
                <CardDescription>
                    Digite seu email para receber um link de redefinição de senha.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {message && (
                    <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-300 text-sm rounded-lg border border-emerald-500/30">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/30">
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
                            placeholder="exemplo@ekkle.com"
                            required
                            className="h-11"
                        />
                    </div>

                    <SubmitButton formAction={forgotPassword} className="w-full h-11 text-base font-semibold">
                        Enviar Link
                    </SubmitButton>
                </form>
            </CardContent>
        </Card>
    )
}
