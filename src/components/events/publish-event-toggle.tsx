'use client'

import { toggleEventPublished } from '@/actions/events'
import { Switch } from '@/components/ui/switch'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface PublishEventToggleProps {
    eventId: string
    isPublished: boolean
}

export function PublishEventToggle({ eventId, isPublished }: PublishEventToggleProps) {
    const [isPending, startTransition] = useTransition()
    const [published, setPublished] = useState(isPublished)

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            try {
                await toggleEventPublished(eventId, checked)
                setPublished(checked)
                toast.success(checked ? 'Evento publicado!' : 'Evento despublicado')
            } catch (error) {
                toast.error('Erro ao atualizar status')
                setPublished(!checked) // Revert
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Switch
                checked={published}
                onCheckedChange={handleToggle}
                disabled={isPending}
                className="data-[state=checked]:bg-emerald-500"
            />
            <span className={`text-xs font-bold ${published ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {published ? 'Publicado' : 'Rascunho'}
            </span>
        </div>
    )
}
