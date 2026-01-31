'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    Maximize2,
    Minimize2,
    Users,
    Loader2
} from 'lucide-react'

interface DailyVideoCallProps {
    roomUrl: string
    token?: string
    userName?: string
    onLeave?: () => void
    onParticipantJoined?: (count: number) => void
    onParticipantLeft?: (count: number) => void
    className?: string
    showControls?: boolean
}

export function DailyVideoCall({
    roomUrl,
    token,
    userName,
    onLeave,
    onParticipantJoined,
    onParticipantLeft,
    className = '',
    showControls = true
}: DailyVideoCallProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [participantCount, setParticipantCount] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)

    // Build the full URL with token if provided
    const fullUrl = token ? `${roomUrl}?t=${token}` : roomUrl

    useEffect(() => {
        // Listen for messages from Daily iframe
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from Daily
            if (!event.origin.includes('daily.co')) return

            const { action, payload } = event.data || {}

            switch (action) {
                case 'joined-meeting':
                    setIsLoading(false)
                    break
                case 'participant-joined':
                    setParticipantCount(prev => {
                        const newCount = prev + 1
                        onParticipantJoined?.(newCount)
                        return newCount
                    })
                    break
                case 'participant-left':
                    setParticipantCount(prev => {
                        const newCount = Math.max(1, prev - 1)
                        onParticipantLeft?.(newCount)
                        return newCount
                    })
                    break
                case 'left-meeting':
                    onLeave?.()
                    break
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onLeave, onParticipantJoined, onParticipantLeft])

    // Handle iframe load
    const handleIframeLoad = () => {
        // Give Daily a moment to initialize
        setTimeout(() => setIsLoading(false), 1500)
    }

    // Toggle fullscreen
    const toggleFullscreen = async () => {
        if (!containerRef.current) return

        if (!isFullscreen) {
            await containerRef.current.requestFullscreen?.()
            setIsFullscreen(true)
        } else {
            await document.exitFullscreen?.()
            setIsFullscreen(false)
        }
    }

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Handle leave
    const handleLeave = () => {
        // Send leave message to iframe
        iframeRef.current?.contentWindow?.postMessage({ action: 'leave-meeting' }, '*')
        onLeave?.()
    }

    return (
        <div
            ref={containerRef}
            className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
        >
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-white font-medium">Conectando...</p>
                    <p className="text-zinc-400 text-sm mt-1">Preparando sua chamada de vídeo</p>
                </div>
            )}

            {/* Daily.co iframe */}
            <iframe
                ref={iframeRef}
                src={fullUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                style={{ minHeight: '400px' }}
                onLoad={handleIframeLoad}
            />

            {/* Custom controls overlay */}
            {showControls && !isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        {/* Participant count */}
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{participantCount} participante{participantCount !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20 rounded-full"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-5 w-5" />
                                ) : (
                                    <Maximize2 className="h-5 w-5" />
                                )}
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleLeave}
                                className="rounded-full gap-2"
                            >
                                <PhoneOff className="h-4 w-4" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Simple video call card with preview before joining
 */
interface VideoCallCardProps {
    roomName: string
    roomUrl: string
    token?: string
    userName: string
    onJoin?: () => void
    onLeave?: () => void
}

export function VideoCallCard({
    roomName,
    roomUrl,
    token,
    userName,
    onJoin,
    onLeave
}: VideoCallCardProps) {
    const [hasJoined, setHasJoined] = useState(false)

    const handleJoin = () => {
        setHasJoined(true)
        onJoin?.()
    }

    const handleLeave = () => {
        setHasJoined(false)
        onLeave?.()
    }

    if (hasJoined) {
        return (
            <div className="w-full aspect-video">
                <DailyVideoCall
                    roomUrl={roomUrl}
                    token={token}
                    userName={userName}
                    onLeave={handleLeave}
                    className="w-full h-full"
                />
            </div>
        )
    }

    return (
        <Card className="p-8 text-center bg-zinc-900 border-zinc-800">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Video className="h-10 w-10 text-primary" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
                Pronto para entrar?
            </h3>

            <p className="text-zinc-400 mb-6">
                Você entrará na sala <span className="text-primary font-medium">{roomName}</span>
            </p>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button
                    size="lg"
                    onClick={handleJoin}
                    className="rounded-full gap-2"
                >
                    <Video className="h-5 w-5" />
                    Entrar na Chamada
                </Button>

                <p className="text-xs text-zinc-500">
                    Sua câmera e microfone serão solicitados
                </p>
            </div>
        </Card>
    )
}
