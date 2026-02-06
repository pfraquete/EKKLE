'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, ChevronLeft } from 'lucide-react'
import { createDepartment, updateDepartment } from '@/actions/departments'
import Link from 'next/link'

interface DepartmentFormProps {
    department?: {
        id: string
        name: string
        description: string | null
        leader_id: string | null
        color: string | null
        status: string
    }
    members?: { id: string; full_name: string }[]
}

export function DepartmentForm({ department, members = [] }: DepartmentFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const isEditing = !!department

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = isEditing
                ? await updateDepartment(department.id, formData)
                : await createDepartment(formData)

            if (result.success) {
                toast({
                    title: isEditing ? 'Departamento atualizado' : 'Departamento criado',
                    description: isEditing ? 'As alterações foram salvas.' : 'O departamento foi criado com sucesso.',
                })
                if (!isEditing && 'id' in result) {
                    router.push(`/departamentos/${result.id}`)
                } else {
                    router.push('/departamentos')
                }
            } else {
                toast({
                    title: 'Erro',
                    description: result.error,
                    variant: 'destructive',
                })
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao salvar departamento',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href={isEditing ? `/departamentos/${department.id}` : '/departamentos'}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">
                        {isEditing ? 'Editar Departamento' : 'Novo Departamento'}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">
                        {isEditing ? 'Altere as informações do departamento' : 'Crie um novo departamento para sua igreja'}
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Informações do Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={department?.name || ''}
                                placeholder="Ex: Departamento de Jovens"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={department?.description || ''}
                                placeholder="Descrição do departamento..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leader_id">Líder</Label>
                            <select
                                id="leader_id"
                                name="leader_id"
                                defaultValue={department?.leader_id || ''}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Sem líder definido</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">Cor</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="color"
                                    name="color"
                                    type="color"
                                    defaultValue={department?.color || '#D4AF37'}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-muted-foreground">Cor do badge do departamento</span>
                            </div>
                        </div>

                        {isEditing && (
                            <input type="hidden" name="status" value={department.status} />
                        )}

                        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditing ? 'Salvar alterações' : 'Criar departamento'}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
