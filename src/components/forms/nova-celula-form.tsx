'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCell } from '@/actions/cells'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ChevronLeft, Home, Mail, User } from 'lucide-react'

interface NovaCelulaFormProps {
    churchId: string
}

export function NovaCelulaForm({ churchId }: NovaCelulaFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('churchId', churchId)
            await createCell(formData)
            router.push('/dashboard')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao criar célula e cadastrar líder.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto bg-zinc-950 min-h-screen p-4 rounded-[2.5rem]">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-black text-white px-2">Nova Célula</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-none bg-zinc-900 shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                            <Home className="h-6 w-6" />
                        </div>
                        <CardTitle>Dados da Célula</CardTitle>
                        <CardDescription>Cadastre a nova célula e as informações do líder.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">Nome da Célula</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Célula Betel"
                                required
                                className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-600"
                            />
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Informações do Líder
                            </h4>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leaderName" className="text-xs font-bold text-muted-foreground uppercase">Nome do Líder</Label>
                                    <Input
                                        id="leaderName"
                                        name="leaderName"
                                        placeholder="Nome completo do líder"
                                        required
                                        className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leaderEmail" className="text-xs font-bold text-muted-foreground uppercase">E-mail do Líder</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="leaderEmail"
                                            name="leaderEmail"
                                            type="email"
                                            placeholder="email@exemplo.com"
                                            required
                                            className="h-12 pl-10 bg-zinc-950/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium px-1">
                                        Se o líder não tiver conta, uma será criada com a senha padrão <strong>ekkle2026</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                PROCESSANDO...
                            </>
                        ) : (
                            'CRIAR CÉLULA E LÍDER'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
