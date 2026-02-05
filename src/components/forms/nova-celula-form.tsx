'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCell, getPotentialLeaders } from '@/actions/cells'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ChevronLeft, Home, Mail, User, UserPlus, Users } from 'lucide-react'

type Member = {
    id: string
    full_name: string
}

export function NovaCelulaForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [members, setMembers] = useState<Member[]>([])
    const [loadingMembers, setLoadingMembers] = useState(true)
    const [leaderMode, setLeaderMode] = useState<'select' | 'create'>('select')
    const [selectedLeaderId, setSelectedLeaderId] = useState('')

    useEffect(() => {
        async function loadMembers() {
            try {
                const data = await getPotentialLeaders()
                setMembers(data)
            } catch (error) {
                console.error('Erro ao carregar membros:', error)
            } finally {
                setLoadingMembers(false)
            }
        }
        loadMembers()
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            
            // Se estiver no modo de seleção, pegar os dados do membro selecionado
            if (leaderMode === 'select' && selectedLeaderId) {
                const selectedMember = members.find(m => m.id === selectedLeaderId)
                if (selectedMember) {
                    formData.set('leaderId', selectedLeaderId)
                    formData.set('leaderName', selectedMember.full_name)
                    // Não precisamos do email quando selecionamos um membro existente
                    formData.delete('leaderEmail')
                }
            }
            
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
        <div className="space-y-6 pb-24 max-w-lg mx-auto bg-zinc-950 min-h-screen p-4 rounded-[2.5rem]">
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
                        <CardDescription>Cadastre a nova célula e selecione o líder.</CardDescription>
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
                                Líder da Célula
                            </h4>

                            {/* Tabs para escolher modo */}
                            <div className="flex gap-2 mb-4">
                                <Button
                                    type="button"
                                    variant={leaderMode === 'select' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setLeaderMode('select')}
                                    className="flex-1 rounded-xl"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Selecionar Membro
                                </Button>
                                <Button
                                    type="button"
                                    variant={leaderMode === 'create' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setLeaderMode('create')}
                                    className="flex-1 rounded-xl"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Novo Líder
                                </Button>
                            </div>

                            {leaderMode === 'select' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="leaderId" className="text-xs font-bold text-muted-foreground uppercase">Selecione o Líder</Label>
                                        {loadingMembers ? (
                                            <div className="flex items-center justify-center h-12 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <select
                                                id="leaderId"
                                                name="leaderId"
                                                value={selectedLeaderId}
                                                onChange={(e) => setSelectedLeaderId(e.target.value)}
                                                required={leaderMode === 'select'}
                                                className="w-full h-12 px-4 bg-zinc-950/50 border border-zinc-800 rounded-xl font-medium text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="">Selecione um membro...</option>
                                                {members.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.full_name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {members.length === 0 && !loadingMembers && (
                                        <p className="text-xs text-amber-500 font-medium px-1">
                                            Nenhum membro encontrado. Use a opção &quot;Novo Líder&quot; para cadastrar.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="leaderName" className="text-xs font-bold text-muted-foreground uppercase">Nome do Líder</Label>
                                        <Input
                                            id="leaderName"
                                            name="leaderName"
                                            placeholder="Nome completo do líder"
                                            required={leaderMode === 'create'}
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
                                                required={leaderMode === 'create'}
                                                className="h-12 pl-10 bg-zinc-950/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-600"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium px-1">
                                            Se o líder não tiver conta, uma será criada com uma <strong>senha temporária</strong> enviada por email.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background to-transparent z-10 pointer-events-none">
                    <div className="max-w-lg mx-auto">
                        <Button
                            type="submit"
                            disabled={isSubmitting || (leaderMode === 'select' && !selectedLeaderId)}
                            className="w-full h-14 text-base font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    PROCESSANDO...
                                </>
                            ) : (
                                'CRIAR CÉLULA'
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
