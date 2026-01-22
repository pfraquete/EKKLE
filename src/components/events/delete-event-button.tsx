'use client'

import { deleteEvent } from '@/actions/events'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteEventButton({ id }: { id: string }) {
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return

        try {
            await deleteEvent(id)
            toast.success('Evento excluído com sucesso')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir evento')
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
            title="Excluir"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
