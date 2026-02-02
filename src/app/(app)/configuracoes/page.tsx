import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileForm } from '@/components/forms/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Globe, MessageSquare, ChevronRight, Wallet, CreditCard } from 'lucide-react'

export default async function SettingsPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Configurações</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Perfil e Preferências • Ekkle</p>
                </div>
            </div>

            <ProfileForm profile={profile} />

            {/* Additional Settings - Only for Pastors */}
            {profile.role === 'PASTOR' && (
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-foreground">
                            Configurações Adicionais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link
                            href="/configuracoes/site"
                            className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl hover:bg-muted/60 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Site Público</p>
                                    <p className="text-xs text-muted-foreground">Configure o site da igreja</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>

                        <Link
                            href="/configuracoes/whatsapp"
                            className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl hover:bg-muted/60 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">WhatsApp</p>
                                    <p className="text-xs text-muted-foreground">Integração e templates</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>

                        <Link
                            href="/configuracoes/pagamentos"
                            className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl hover:bg-muted/60 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Wallet className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Pagamentos</p>
                                    <p className="text-xs text-muted-foreground">Conta bancária e recebimentos</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>

                        <Link
                            href="/configuracoes/assinatura"
                            className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl hover:bg-muted/60 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Assinatura</p>
                                    <p className="text-xs text-muted-foreground">Plano e faturamento</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* App Status Card */}
                <Card className="border-none shadow-lg rounded-3xl md:max-w-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Aplicativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-foreground">Versão</p>
                                <p className="text-xs text-muted-foreground">v1.0.0-production</p>
                            </div>
                            <Badge variant="outline" className="font-bold text-emerald-300 bg-emerald-500/10 border-emerald-500/30">Atualizado</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-foreground">Servidor</p>
                                <p className="text-xs text-muted-foreground">Região: US-East</p>
                            </div>
                            <Badge variant="outline" className="font-bold text-blue-300 bg-blue-500/10 border-blue-500/30">Online</Badge>
                        </div>
                        <div className="pt-2 text-xs text-muted-foreground font-bold uppercase tracking-widest text-center">
                            Entrou em: {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('pt-BR') : '—'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 opacity-40">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[2px]">MVP Célula v1.0 • Desenvolvido para Ekkle</p>
            </div>
        </div>
    )
}
