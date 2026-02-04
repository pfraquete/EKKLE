'use client'

import { useState, useEffect } from 'react'
import { UserCog, Clock, X, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface ImpersonationBannerProps {
    adminEmail: string
    adminName?: string | null
    targetEmail: string
    targetName?: string | null
    targetChurchName?: string | null
    expiresAt: string
    reason: string
}

export function ImpersonationBanner({
    adminEmail,
    adminName,
    targetEmail,
    targetName,
    targetChurchName,
    expiresAt,
    reason,
}: ImpersonationBannerProps) {
    const [timeLeft, setTimeLeft] = useState('')
    const [isEnding, setIsEnding] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const updateTime = () => {
            const expires = new Date(expiresAt)
            setTimeLeft(formatDistanceToNow(expires, {
                locale: ptBR,
                addSuffix: true
            }))
        }

        updateTime()
        const interval = setInterval(updateTime, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [expiresAt])

    const handleEndSession = async () => {
        setIsEnding(true)
        try {
            const response = await fetch('/api/admin/impersonation/end', {
                method: 'POST',
            })

            if (response.ok) {
                router.push('/admin')
                router.refresh()
            } else {
                console.error('Failed to end impersonation session')
                setIsEnding(false)
            }
        } catch (error) {
            console.error('Error ending session:', error)
            setIsEnding(false)
        }
    }

    const displayAdmin = adminName || adminEmail
    const displayTarget = targetName || targetEmail

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                {/* Left side - Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <UserCog className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm truncate">
                        <span className="font-semibold">{displayAdmin}</span>
                        {' '}visualizando como{' '}
                        <span className="font-semibold">{displayTarget}</span>
                        {targetChurchName && (
                            <span className="hidden md:inline text-amber-800">
                                {' '}({targetChurchName})
                            </span>
                        )}
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Time left */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-800">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Expira {timeLeft}</span>
                    </div>

                    {/* Reason badge */}
                    <div className="hidden lg:block text-xs bg-amber-600/30 px-2 py-1 rounded max-w-[200px] truncate">
                        {reason}
                    </div>

                    {/* End session button */}
                    <button
                        onClick={handleEndSession}
                        disabled={isEnding}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {isEnding ? 'Encerrando...' : 'Voltar ao Admin'}
                        </span>
                        <span className="sm:hidden">
                            {isEnding ? '...' : 'Sair'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Warning stripe */}
            <div className="h-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]" />
        </div>
    )
}

/**
 * Server component wrapper that fetches impersonation data
 */
export async function ImpersonationBannerWrapper() {
    // This will be imported and used in layouts
    // The actual data fetching happens in the layout
    return null
}
