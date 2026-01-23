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
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
            <div className="w-full max-w-md space-y-6">
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
                    <CardHeader className="space-y-1 bg-muted/30 border-b border-border text-center p-8">
                        {church ? (
                            <div className="flex flex-col items-center gap-4">
                                {church.logo_url ? (
                                    <div className="w-20 h-20 relative bg-white rounded-2xl p-2 shadow-inner">
                                        <Image
                                            src={church.logo_url}
                                            alt={church.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-2xl font-black text-primary">{church.name[0]}</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black text-foreground tracking-tight">
                                        {church.name}
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                                        Painel de Membros
                                    </CardDescription>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-black text-foreground tracking-tight uppercase">Acesse sua conta</CardTitle>
                                <CardDescription className="text-muted-foreground font-medium">
                                    Entre com seu email e senha para acessar o sistema
                                </CardDescription>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-8">
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

                        <form className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="exemplo@ekkle.com"
                                    required
                                    className="h-12 rounded-xl bg-background border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Senha</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-primary hover:underline font-bold"
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
                                    className="h-12 rounded-xl bg-background border-border"
                                />
                            </div>

                            <SubmitButton formAction={signIn} className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl mt-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Entrar no Painel
                            </SubmitButton>
                        </form>
                    </CardContent>
                    <div className="p-6 bg-muted/20 text-center text-sm border-t border-border">
                        <span className="text-muted-foreground font-medium">Não tem uma conta?</span>{' '}
                        <Link href="/registro" className="text-primary hover:underline font-black">
                            Criar minha igreja
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}
