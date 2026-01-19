'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCell, getPotentialLeaders } from '@/actions/cells'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ChevronLeft, Home, UserCheck } from 'lucide-react'

interface NovaCelulaFormProps {
    churchId: string
}

export function NovaCelulaForm({ churchId }: NovaCelulaFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leaders, setLeaders] = useState<{ id: string, full_name: string }[]>([])

    useEffect(() => {
        getPotentialLeaders(churchId).then(setLeaders)
    }, [churchId])

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
            alert('Erro ao criar célula.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Nova Célula</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                            <Home className="h-6 w-6" />
                        </div>
                        <CardTitle>Dados da Célula</CardTitle>
                        <CardDescription>Defina o nome e o líder responsável pelo novo grupo.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase">Nome da Célula</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Célula Betel"
                                required
                                className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leaderId" className="text-xs font-bold text-gray-400 uppercase">Líder Responsável</Label>
                            <Select name="leaderId">
                                <SelectTrigger className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-medium">
                                    <SelectValue placeholder="Selecione um líder" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaders.map(leader => (
                                        <SelectItem key={leader.id} value={leader.id}>
                                            {leader.full_name}
                                        </SelectItem>
                                    ))}
                                    {leaders.length === 0 && (
                                        <div className="p-2 text-center text-xs text-gray-400">Nenhum perfil disponível</div>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-gray-400 font-medium px-1">
                                Ao selecionar um líder, o cargo dele será atualizado para "Líder" automaticamente.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                CRIANDO...
                            </>
                        ) : (
                            'CRIAR CÉLULA'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
