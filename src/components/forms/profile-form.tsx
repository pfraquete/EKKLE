'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Camera, User, Phone, Save, Mail } from 'lucide-react'

interface ProfileFormProps {
    profile: {
        id: string
        full_name: string
        email: string | null
        phone: string | null
        photo_url: string | null
        role: string
    }
}

export function ProfileForm({ profile }: ProfileFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile.photo_url)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)

            // Auto-submit form when photo is chosen
            const form = e.target.form
            if (form) {
                form.requestSubmit()
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('currentPhotoUrl', profile.photo_url || '')
            await updateProfile(formData)
            router.refresh()
            // Optional: User feedback could be better than alert, but alert works for now.
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar perfil.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="relative group">
                            <Avatar
                                className="h-28 w-28 border-4 border-primary/10 shadow-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <AvatarImage src={previewUrl || undefined} className="object-cover" />
                                {isSubmitting && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full z-10">
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    </div>
                                )}
                                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
                                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <input
                                type="file"
                                name="avatar"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2 flex-1">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h2 className="text-3xl font-black text-foreground">{profile.full_name}</h2>
                                <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-black uppercase">
                                    {profile.role}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-medium">
                                    <Mail className="h-4 w-4" /> {profile.email || 'E-mail não cadastrado'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Editar Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={profile.full_name}
                                required
                                className="h-12 bg-zinc-900/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">Telefone / WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={profile.phone || ''}
                                    placeholder="(00) 00000-0000"
                                    className="h-12 pl-10 bg-zinc-900/50 border-zinc-800 rounded-xl font-medium text-white placeholder:text-zinc-500"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 mt-4 font-bold rounded-xl shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-3xl bg-muted/20">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Foto de Perfil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                        <div
                            className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
                            Clique no círculo acima ou na foto principal para alterar sua imagem de perfil.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
