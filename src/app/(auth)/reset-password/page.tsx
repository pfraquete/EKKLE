
import { resetPassword } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/buttons/submit-button'

export const dynamic = 'force-dynamic'


export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ code?: string; error?: string; message?: string }>
}) {
    const { error, message } = await searchParams

    return (
        <Card className="border-none shadow-xl w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
                <CardDescription>
                    Digite sua nova senha abaixo.
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
                    {/* Code is automatically handled by Supabase Auth Exchange Code but good to have hidden if redirect method is used differently, 
                        though usually creating a client side logic or server action to handle code exchange is better. 
                        For now, assuming code exchange happens or session is active.
                        Actually, updatePassword requires an active session.
                        If the link is type=recovery, it logs the user in. So we just need the password update form.
                    */}

                    <div className="space-y-2">
                        <Label htmlFor="password">Nova Senha</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="h-11"
                        />
                    </div>

                    <SubmitButton formAction={resetPassword} className="w-full h-11 text-base font-semibold">
                        Atualizar Senha
                    </SubmitButton>
                </form>
            </CardContent>
        </Card>
    )
}
