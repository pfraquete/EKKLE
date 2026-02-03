'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FeedSettings, UserRole, ROLE_LABELS, UpdateFeedSettingsInput } from '@/types/feed'
import { updateFeedSettings } from '@/actions/feed'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface FeedSettingsFormProps {
    settings: FeedSettings
}

export function FeedSettingsForm({ settings }: FeedSettingsFormProps) {
    const [formData, setFormData] = useState<UpdateFeedSettingsInput>({
        min_role_to_post: settings.min_role_to_post,
        require_approval: settings.require_approval,
        allow_comments: settings.allow_comments,
        allow_reactions: settings.allow_reactions,
        allow_media: settings.allow_media,
        max_media_per_post: settings.max_media_per_post,
    })
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const result = await updateFeedSettings(formData)

            if (result.success) {
                toast({
                    title: 'Configurações salvas',
                    description: 'As alterações foram aplicadas com sucesso',
                })
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
                description: 'Falha ao salvar configurações',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const roles: UserRole[] = ['MEMBER', 'LEADER', 'DISCIPULADOR', 'PASTOR']

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Who can post */}
            <div className="space-y-2">
                <Label htmlFor="min_role">Quem pode publicar no feed?</Label>
                <Select
                    value={formData.min_role_to_post}
                    onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, min_role_to_post: value as UserRole }))
                    }
                >
                    <SelectTrigger id="min_role">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                                {role === 'MEMBER' && ' (Todos)'}
                                {role === 'PASTOR' && ' (Apenas pastor)'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    {formData.min_role_to_post === 'MEMBER'
                        ? 'Todos os membros podem criar publicações'
                        : formData.min_role_to_post === 'PASTOR'
                        ? 'Apenas o pastor pode criar publicações'
                        : `${ROLE_LABELS[formData.min_role_to_post]} e papéis superiores podem criar publicações`}
                </p>
            </div>

            {/* Require approval */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="require_approval">Aprovar publicações</Label>
                    <p className="text-sm text-muted-foreground">
                        Publicações precisam ser aprovadas antes de aparecer no feed
                    </p>
                </div>
                <Switch
                    id="require_approval"
                    checked={formData.require_approval}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, require_approval: checked }))
                    }
                />
            </div>

            {/* Allow comments */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="allow_comments">Permitir comentários</Label>
                    <p className="text-sm text-muted-foreground">
                        Membros podem comentar nas publicações
                    </p>
                </div>
                <Switch
                    id="allow_comments"
                    checked={formData.allow_comments}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, allow_comments: checked }))
                    }
                />
            </div>

            {/* Allow reactions */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="allow_reactions">Permitir reações</Label>
                    <p className="text-sm text-muted-foreground">
                        Membros podem reagir às publicações
                    </p>
                </div>
                <Switch
                    id="allow_reactions"
                    checked={formData.allow_reactions}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, allow_reactions: checked }))
                    }
                />
            </div>

            {/* Allow media */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="allow_media">Permitir fotos e vídeos</Label>
                    <p className="text-sm text-muted-foreground">
                        Membros podem anexar fotos e vídeos às publicações
                    </p>
                </div>
                <Switch
                    id="allow_media"
                    checked={formData.allow_media}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, allow_media: checked }))
                    }
                />
            </div>

            {/* Max media per post */}
            {formData.allow_media && (
                <div className="space-y-2">
                    <Label htmlFor="max_media">Máximo de arquivos por publicação</Label>
                    <Input
                        id="max_media"
                        type="number"
                        min={1}
                        max={20}
                        value={formData.max_media_per_post}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                max_media_per_post: parseInt(e.target.value) || 1,
                            }))
                        }
                        className="w-24"
                    />
                </div>
            )}

            {/* Submit button */}
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar configurações
                    </>
                )}
            </Button>
        </form>
    )
}
