import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/forms/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone } from 'lucide-react'

export default async function SettingsPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Configurações</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Perfil e Preferências • Videira SJC</p>
                </div>
            </div>

            <ProfileForm profile={profile} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* App Status Card */}
                <Card className="border-none shadow-lg rounded-3xl">
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
                        <div className="pt-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                            Entrou em: {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('pt-BR') : '—'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 opacity-40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px]">MVP Célula v1.0 • Desenvolvido para Videira SJC</p>
            </div>
        </div>
    )
}
