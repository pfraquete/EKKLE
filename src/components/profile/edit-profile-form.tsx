'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMyProfile } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Save, X, Loader2, Calendar, User, Phone } from 'lucide-react'

interface Props {
    profile: {
        full_name: string
        phone: string | null
        birthday: string | null
    }
}

export function EditProfileForm({ profile }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState(profile.full_name)
    const [phone, setPhone] = useState(profile.phone || '')
    const [birthday, setBirthday] = useState(
        profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : ''
    )

    const handleSave = async () => {
        if (!fullName.trim()) return
        setSaving(true)
        try {
            const result = await updateMyProfile({
                full_name: fullName.trim(),
                phone: phone.trim() || undefined,
                birthday: birthday || undefined,
            })
            if (result.success) {
                setEditing(false)
                router.refresh()
            } else {
                alert(result.error || 'Erro ao salvar')
            }
        } catch {
            alert('Erro ao salvar perfil')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFullName(profile.full_name)
        setPhone(profile.phone || '')
        setBirthday(profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '')
        setEditing(false)
    }

    if (!editing) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-xl border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 gap-2"
            >
                <Pencil className="w-3.5 h-3.5" />
                Editar
            </Button>
        )
    }

    return (
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-primary/5 border-b border-primary/20 p-4 sm:p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Editar Perfil</h3>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-5">
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Nome Completo
                    </Label>
                    <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="Seu nome completo"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        Telefone / WhatsApp
                    </Label>
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="(11) 99999-9999"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Data de Aniversário
                    </Label>
                    <Input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="h-12 rounded-xl block"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving || !fullName.trim()}
                        className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={saving}
                        className="h-12 rounded-xl border border-border/50 px-6 font-bold text-muted-foreground gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    )
}
