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
import { createEbdClass, updateEbdClass } from '@/actions/ebd'
import Link from 'next/link'

interface EbdClassFormProps {
    ebdClass?: {
        id: string
        title: string
        description: string | null
        teacher_id: string | null
        is_published: boolean
    }
    teachers?: { id: string; full_name: string }[]
}

export function EbdClassForm({ ebdClass, teachers = [] }: EbdClassFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [title, setTitle] = useState(ebdClass?.title || '')
    const [description, setDescription] = useState(ebdClass?.description || '')
    const [teacherId, setTeacherId] = useState(ebdClass?.teacher_id || '')
    const isEditing = !!ebdClass

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const result = isEditing
                ? await updateEbdClass(ebdClass.id, {
                    title,
                    description,
                    teacher_id: teacherId || undefined,
                    is_published: ebdClass.is_published,
                })
                : await createEbdClass({
                    title,
                    description,
                    teacher_id: teacherId || undefined,
                })

            if (result.success) {
                toast({
                    title: isEditing ? 'Classe atualizada' : 'Classe criada',
                    description: isEditing ? 'As alterações foram salvas.' : 'A classe foi criada com sucesso.',
                })
                if (!isEditing && 'id' in result) {
                    router.push(`/ebd/${result.id}`)
                } else {
                    router.push('/ebd')
                }
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar classe', variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href={isEditing ? `/ebd/${ebdClass.id}` : '/ebd'}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">
                        {isEditing ? 'Editar Classe' : 'Nova Classe da EBD'}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">
                        {isEditing ? 'Altere as informações da classe' : 'Crie uma nova classe para a escola bíblica'}
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Informações da Classe</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Nome da Classe *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Classe dos Jovens"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descrição da classe..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="teacher_id">Professor</Label>
                            <select
                                id="teacher_id"
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Sem professor definido</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditing ? 'Salvar alterações' : 'Criar classe'}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
