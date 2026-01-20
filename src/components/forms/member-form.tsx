'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMember, updateMember, deleteMember } from '@/actions/members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trash2, Camera, ChevronLeft, User, Phone, Mail, Calendar } from 'lucide-react'
import Image from 'next/image'
interface MemberFormProps {
    initialData?: MemberFormData
    cellId: string
    churchId: string
}

interface MemberFormData {
    id?: string
    full_name?: string
    photo_url?: string | null
    phone?: string | null
    email?: string | null
    member_stage?: string
    birthday?: string | null
}

export function MemberForm({ initialData, cellId, churchId }: MemberFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('cellId', cellId)
            formData.append('churchId', churchId)

            if (initialData?.id) {
                await updateMember(initialData.id, formData)
            } else {
                await createMember(formData)
            }

            router.push('/minha-celula/membros')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar membro.')
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return
        setIsDeleting(true)
        try {
            await deleteMember(initialData.id)
            router.push('/minha-celula/membros')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao remover membro.')
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto">
            {/* Dynamic Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">
                        {initialData ? 'Editar Membro' : 'Novo Membro'}
                    </h1>
                </div>
                {initialData && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"
                    >
                        {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload Placeholder */}
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative">
                        <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden shadow-inner">
                            {initialData?.photo_url ? (
                                <Image
                                    src={initialData.photo_url}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            ) : (
                                <User className="h-10 w-10 text-muted-foreground/50" />
                            )}
                        </div>
                        <button type="button" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-105 transition-transform">
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Toque para adicionar foto</p>
                </div>

                <Card className="border-none shadow-xl rounded-3xl">
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    placeholder="Nome do membro"
                                    defaultValue={initialData?.full_name}
                                    required
                                    className="pl-10 h-12 bg-muted/40 border-border rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="(12) 99999-9999"
                                    defaultValue={initialData?.phone}
                                    className="pl-10 h-12 bg-muted/40 border-border rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">Email (Opcional)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    defaultValue={initialData?.email}
                                    className="pl-10 h-12 bg-muted/40 border-border rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="memberStage" className="text-xs font-bold text-muted-foreground uppercase">Vínculo com a Célula</Label>
                            <Select name="memberStage" defaultValue={initialData?.member_stage || 'MEMBER'}>
                                <SelectTrigger className="h-12 bg-muted/40 border-border rounded-xl">
                                    <SelectValue placeholder="Selecione o vínculo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VISITOR">Visitante (1ª Vez)</SelectItem>
                                    <SelectItem value="REGULAR_VISITOR">Frequenta Regularmente</SelectItem>
                                    <SelectItem value="MEMBER">Membro da Célula</SelectItem>
                                    <SelectItem value="LEADER">Líder Auxiliar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birthday" className="text-xs font-bold text-muted-foreground uppercase">Data de Nascimento</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="birthday"
                                    name="birthday"
                                    type="date"
                                    defaultValue={initialData?.birthday}
                                    className="pl-10 h-12 bg-muted/40 border-border rounded-xl appearance-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Floating Save Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/40 rounded-3xl pointer-events-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                SALVANDO...
                            </>
                        ) : (
                            'SALVAR MEMBRO'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
