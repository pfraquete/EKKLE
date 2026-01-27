// RESCUE MODE - DEBUGGING BLANK PAGE
import { signIn } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/buttons/submit-button'
import Link from 'next/link'
// import Image from 'next/image'
// import { getChurch } from '@/lib/get-church'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const { message, error } = await searchParams

    // DEBUG: Commenting out dynamic data fetch
    // let church = null
    // try {
    //     church = await getChurch()
    // } catch (err) {
    //     console.error('Error loading church for login:', err)
    // }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-white">
            <div className="w-full max-w-md space-y-6">
                <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl font-bold text-white">REPAIR MODE</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Estamos diagnosticando o sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-500 text-sm rounded-xl border border-emerald-500/20 font-bold">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 font-bold">
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
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>

                            <SubmitButton formAction={signIn} className="w-full bg-white text-black hover:bg-zinc-200">
                                Entrar (Debug)
                            </SubmitButton>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
