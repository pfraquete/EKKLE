import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Settings,
    User,
    Mail,
    Shield,
    Home,
    Smartphone,
    LogOut
} from 'lucide-react'

export default async function SettingsPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">Perfil e Preferências • Videira SJC</p>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <Avatar className="h-28 w-28 border-4 border-primary/10 shadow-lg">
                            <AvatarImage src={profile.photo_url || undefined} />
                            <AvatarFallback className="bg-primary text-white text-3xl font-black">
                                {profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2 flex-1">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h2 className="text-3xl font-black text-gray-900">{profile.full_name}</h2>
                                <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1">
                                    {profile.role}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium">
                                    <Mail className="h-4 w-4" /> {profile.email || 'E-mail não cadastrado'}
                                </p>
                                <p className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium">
                                    <Shield className="h-4 w-4" /> Permissões de {profile.role === 'PASTOR' ? 'Administrador' : 'Líder'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Information Card */}
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Nome Completo</label>
                            <p className="font-bold text-gray-900">{profile.full_name}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Telefone</label>
                            <p className="font-bold text-gray-900">{profile.phone || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Data de Ingresso</label>
                            <p className="font-bold text-gray-900">
                                {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('pt-BR') : '—'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* App Status Card */}
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Aplicativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Versão</p>
                                <p className="text-xs text-gray-500">v1.0.0-production</p>
                            </div>
                            <Badge variant="outline" className="font-bold text-green-600 bg-green-50 border-green-100">Atualizado</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Servidor</p>
                                <p className="text-xs text-gray-500">Região: US-East</p>
                            </div>
                            <Badge variant="outline" className="font-bold text-blue-600 bg-blue-50 border-blue-100">Online</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 opacity-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">MVP Célula v1.0 • Desenvolvido para Videira SJC</p>
            </div>
        </div>
    )
}
