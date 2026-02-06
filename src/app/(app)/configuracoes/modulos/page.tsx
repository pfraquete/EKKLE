import { getProfile } from '@/actions/auth'
import { getChurchModules } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { ModulesForm } from '@/components/settings/modules-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ModulesSettingsPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const modules = await getChurchModules()

    if (!modules) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <Link href="/configuracoes">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-black text-foreground">Módulos da Igreja</h1>
                </div>
                <p className="text-muted-foreground">Erro ao carregar configurações de módulos.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/configuracoes">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-foreground">Módulos da Igreja</h1>
                    <p className="text-muted-foreground">
                        Ative ou desative módulos conforme a necessidade da sua igreja.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-foreground">
                        Módulos Disponíveis
                    </CardTitle>
                    <CardDescription>
                        Escolha quais funcionalidades estarão ativas para sua igreja
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ModulesForm modules={modules} />
                </CardContent>
            </Card>
        </div>
    )
}
