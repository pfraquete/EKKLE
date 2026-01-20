import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function MembersPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Membros</h1>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Lista geral de membros da igreja</p>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardContent className="p-20 text-center">
                    <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Página de membros em desenvolvimento.</p>
                </CardContent>
            </Card>
        </div>
    )
}
