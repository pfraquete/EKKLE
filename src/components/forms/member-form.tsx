'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMember, updateMember, deleteMember } from '@/actions/members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Loader2, Trash2, Camera, ChevronLeft, User, Phone, Mail, Calendar } from 'lucide-react'
import Image from 'next/image'
interface MemberFormProps {
    initialData?: MemberFormData
    cellId: string
    churchId: string
    currentUserRole?: string
}

interface MemberFormData {
    id?: string
    full_name?: string
    photo_url?: string | null
    phone?: string | null
    email?: string | null
    member_stage?: string
    birthday?: string | null
    role?: string
}

export function MemberForm({ initialData, cellId, churchId, currentUserRole }: MemberFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

    const handleDeleteConfirm = async () => {
        setIsDeleting(true)
        try {
            if (initialData?.id) {
                await deleteMember(initialData.id)
            }
            setShowDeleteDialog(false)
            router.push('/minha-celula/membros')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao remover membro.')
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto bg-zinc-950 min-h-screen p-4 rounded-[2.5rem]">
            {/* Dynamic Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-black text-white px-2">
                        {initialData ? 'Editar Membro' : 'Novo Membro'}
                    </h1>
                </div>
                {initialData && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"
                    >
                        <Trash2 className="h-5 w-5" />
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
                        <button type="button" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform">
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Toque para adicionar foto</p>
                </div>

                <Card className="border-none bg-zinc-900 shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    placeholder="Nome Completo"
                                    defaultValue={initialData?.full_name || ''}
                                    required
                                    className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 rounded-xl text-white placeholder:text-zinc-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="(12) 99999-9999"
                                    defaultValue={initialData?.phone ?? ''}
                                    className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 rounded-xl text-white placeholder:text-zinc-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Email (Opcional)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    defaultValue={initialData?.email ?? ''}
                                    className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 rounded-xl text-white placeholder:text-zinc-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="memberStage" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Vínculo com a Célula</Label>
                            <Select name="memberStage" defaultValue={initialData?.member_stage || 'MEMBER'}>
                                <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-800 rounded-xl text-white">
                                    <SelectValue placeholder="Selecione o vínculo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PASTOR">Pastor</SelectItem>
                                    <SelectItem value="LEADER">Líder de Célula</SelectItem>
                                    <SelectItem value="TRAINING_LEADER">Líder em Treinamento</SelectItem>
                                    <SelectItem value="GUARDIAN_ANGEL">Anjo da Guarda</SelectItem>
                                    <SelectItem value="MEMBER">Membro da Célula</SelectItem>
                                    <SelectItem value="REGULAR_VISITOR">Frequentador Assíduo</SelectItem>
                                    <SelectItem value="VISITOR">Visitante</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {currentUserRole === 'PASTOR' && (
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Permissão de Acesso (CUIDADO)</Label>
                                <Select name="role" defaultValue={initialData?.role || 'MEMBER'}>
                                    <SelectTrigger className="h-12 bg-zinc-900/50 border-destructive/20 rounded-xl text-white focus:ring-destructive">
                                        <SelectValue placeholder="Selecione a permissão" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MEMBER">Membro (Padrão)</SelectItem>
                                        <SelectItem value="LEADER">Líder (Acesso Admin)</SelectItem>
                                        <SelectItem value="PASTOR">Pastor (Acesso Total)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-zinc-500 px-1">
                                    Define o nível de acesso ao sistema. Só altere se souber o que está fazendo.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="birthday" className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Data de Nascimento</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="birthday"
                                    name="birthday"
                                    type="date"
                                    defaultValue={initialData?.birthday ?? ''}
                                    className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 rounded-xl appearance-none text-white"
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                title="Remover Membro"
                description={`Tem certeza que deseja remover ${initialData?.full_name || 'este membro'}? Esta ação não pode ser desfeita.`}
                confirmText="Remover"
                cancelText="Cancelar"
                variant="destructive"
                isLoading={isDeleting}
            />
        </div >
    )
}
