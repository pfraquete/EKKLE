'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ArrowLeft,
    Baby,
    User,
    Phone,
    Mail,
    Calendar,
    Home,
    AlertTriangle,
    Stethoscope,
    Loader2,
    Save
} from 'lucide-react'
import { createKidsChild } from '@/actions/kids-children'
import { getKidsCells } from '@/actions/kids-cells'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface KidsCell {
    id: string
    name: string
}

export default function NovaCriancaPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [cells, setCells] = useState<KidsCell[]>([])
    const [formData, setFormData] = useState({
        full_name: '',
        birth_date: '',
        gender: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        kids_cell_id: '',
        allergies: '',
        medical_notes: '',
    })

    useEffect(() => {
        async function loadCells() {
            const data = await getKidsCells()
            setCells(data.map(c => ({ id: c.id, name: c.name })))
        }
        loadCells()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await createKidsChild({
                full_name: formData.full_name,
                birth_date: formData.birth_date || null,
                gender: formData.gender as 'M' | 'F' | null || null,
                parent_name: formData.parent_name || null,
                parent_phone: formData.parent_phone || null,
                parent_email: formData.parent_email || null,
                kids_cell_id: formData.kids_cell_id || null,
                allergies: formData.allergies || null,
                medical_notes: formData.medical_notes || null,
            })

            if (result.success) {
                toast.success('Crianca cadastrada com sucesso!')
                router.push('/rede-kids/criancas')
            } else {
                toast.error(result.error || 'Erro ao cadastrar crianca')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rede-kids/criancas">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Nova Crianca</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Cadastrar nova crianca na Rede Kids
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados da Crianca */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Baby className="w-5 h-5 text-primary" />
                            Dados da Crianca
                        </CardTitle>
                        <CardDescription>
                            Informacoes basicas da crianca
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Nome Completo *
                            </Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Nome completo da crianca"
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birth_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Data de Nascimento
                                </Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Genero
                                </Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="M">Masculino</SelectItem>
                                        <SelectItem value="F">Feminino</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Home className="w-3 h-3" />
                                Celula Kids
                            </Label>
                            <Select
                                value={formData.kids_cell_id}
                                onValueChange={(value) => setFormData({ ...formData, kids_cell_id: value })}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Selecione uma celula (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cells.map(cell => (
                                        <SelectItem key={cell.id} value={cell.id}>
                                            {cell.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados do Responsavel */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-blue-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5 text-blue-500" />
                            Dados do Responsavel
                        </CardTitle>
                        <CardDescription>
                            Informacoes de contato dos pais ou responsaveis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="parent_name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Nome do Responsavel
                            </Label>
                            <Input
                                id="parent_name"
                                value={formData.parent_name}
                                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                                placeholder="Nome do pai, mae ou responsavel"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parent_phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    Telefone
                                </Label>
                                <Input
                                    id="parent_phone"
                                    type="tel"
                                    value={formData.parent_phone}
                                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parent_email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    Email
                                </Label>
                                <Input
                                    id="parent_email"
                                    type="email"
                                    value={formData.parent_email}
                                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informacoes Medicas */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-red-500/5 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Stethoscope className="w-5 h-5 text-red-500" />
                            Informacoes Medicas
                        </CardTitle>
                        <CardDescription>
                            Alergias e observacoes importantes de saude
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="allergies" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Alergias
                            </Label>
                            <Textarea
                                id="allergies"
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                placeholder="Liste alergias alimentares, medicamentosas ou outras..."
                                className="min-h-[80px] rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medical_notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Observacoes Medicas
                            </Label>
                            <Textarea
                                id="medical_notes"
                                value={formData.medical_notes}
                                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                                placeholder="Outras informacoes importantes sobre a saude da crianca..."
                                className="min-h-[80px] rounded-xl"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Link href="/rede-kids/criancas" className="flex-1">
                        <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-bold">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isPending || !formData.full_name}
                        className="flex-1 h-12 rounded-xl font-bold shadow-lg"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Cadastrar Crianca
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
