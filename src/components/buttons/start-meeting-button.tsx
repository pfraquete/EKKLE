'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startMeeting } from '@/actions/meetings'
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'

export function StartMeetingButton({ cellId }: { cellId: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleStart = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            const meeting = await startMeeting(cellId)
            router.push(`/minha-celula/reuniao/${meeting.id}`)
        } catch (error) {
            console.error(error)
            alert('Erro ao iniciar reunião')
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-all"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Iniciando...
                </>
            ) : (
                <>
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Iniciar Reunião
                </>
            )}
        </Button>
    )
}
