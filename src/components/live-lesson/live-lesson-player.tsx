'use client'

import { useEffect, useRef, useState } from 'react'
import { joinLiveLesson, leaveLiveLesson, updateWatchTime } from '@/actions/course-live-lessons'
import { Radio, Loader2 } from 'lucide-react'

interface LiveLessonPlayerProps {
    lessonId: string
    playbackId?: string
    profileId?: string
}

export function LiveLessonPlayer({ lessonId, playbackId, profileId }: LiveLessonPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const watchTimeRef = useRef(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        // Join lesson when component mounts
        const handleJoin = async () => {
            if (profileId) {
                await joinLiveLesson(lessonId)
            }
        }

        handleJoin()

        // Leave lesson when component unmounts
        return () => {
            if (profileId) {
                leaveLiveLesson(lessonId)
            }
        }
    }, [lessonId, profileId])

    useEffect(() => {
        // Update watch time every 30 seconds
        const interval = setInterval(async () => {
            if (profileId && watchTimeRef.current > 0) {
                await updateWatchTime(lessonId, watchTimeRef.current)
                watchTimeRef.current = 0
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [lessonId, profileId])

    useEffect(() => {
        // Track watch time
        const handleTimeUpdate = () => {
            watchTimeRef.current += 1
        }

        const video = videoRef.current
        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate)
            return () => video.removeEventListener('timeupdate', handleTimeUpdate)
        }
    }, [])

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // User switched tabs - mark as offline temporarily
                if (profileId && watchTimeRef.current > 0) {
                    await updateWatchTime(lessonId, watchTimeRef.current)
                    watchTimeRef.current = 0
                }
            } else {
                // User came back
                if (profileId) {
                    await joinLiveLesson(lessonId)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [lessonId, profileId])

    if (!playbackId) {
        return (
            <div className="aspect-video bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8">
                <Radio className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                <p className="text-muted-foreground text-center">
                    Aguardando o professor iniciar a transmissão...
                </p>
            </div>
        )
    }

    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`

    return (
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                        <p className="text-white/80 text-sm">Carregando transmissão...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center text-center p-4">
                        <Radio className="w-10 h-10 text-red-500/50 mb-3" />
                        <p className="text-white/80 text-sm">{error}</p>
                        <button
                            onClick={() => {
                                setError('')
                                setIsLoading(true)
                                if (videoRef.current) {
                                    videoRef.current.load()
                                }
                            }}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            )}

            {/* Live badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 text-white rounded-lg text-sm font-bold backdrop-blur-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                AO VIVO
            </div>

            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                onLoadedData={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false)
                    setError('Não foi possível carregar a transmissão')
                }}
            >
                <source src={streamUrl} type="application/x-mpegURL" />
                Seu navegador não suporta vídeo HTML5.
            </video>
        </div>
    )
}
