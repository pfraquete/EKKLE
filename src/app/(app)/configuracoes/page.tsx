import { Card, CardContent } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Gerencie seu perfil e preferências</p>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardContent className="p-20 text-center">
                    <Settings className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Página de configurações em desenvolvimento.</p>
                </CardContent>
            </Card>
        </div>
    )
}
