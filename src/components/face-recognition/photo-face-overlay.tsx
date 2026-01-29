'use client'

import { useEffect, useState } from 'react'
import { getPhotoDetections, PhotoFaceResult } from '@/actions/face-recognition'
import Image from 'next/image'

interface PhotoFaceOverlayProps {
    photoId: string
    photoUrl: string
    className?: string
}

export function PhotoFaceOverlay({ photoId, photoUrl, className = '' }: PhotoFaceOverlayProps) {
    const [faces, setFaces] = useState<PhotoFaceResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showNames, setShowNames] = useState(true)

    useEffect(() => {
        async function loadFaces() {
            setIsLoading(true)
            const result = await getPhotoDetections(photoId)
            if (result.success && result.data) {
                setFaces(result.data)
            }
            setIsLoading(false)
        }

        loadFaces()
    }, [photoId])

    return (
        <div className={`relative ${className}`}>
            <Image
                src={photoUrl}
                alt="Foto"
                fill
                className="object-contain"
            />

            {/* Face boxes overlay */}
            {!isLoading && faces.map((face) => (
                <div
                    key={face.detectionId}
                    className="absolute border-2 border-primary/80 rounded-lg transition-all hover:border-primary hover:bg-primary/10"
                    style={{
                        left: `${face.boxX * 100}%`,
                        top: `${face.boxY * 100}%`,
                        width: `${face.boxWidth * 100}%`,
                        height: `${face.boxHeight * 100}%`,
                    }}
                >
                    {/* Name tag */}
                    {showNames && face.fullName && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg">
                                {face.fullName}
                            </div>
                        </div>
                    )}

                    {/* Unknown face indicator */}
                    {showNames && !face.profileId && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded-full shadow-lg">
                                Desconhecido
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Toggle names button */}
            {faces.length > 0 && (
                <button
                    onClick={() => setShowNames(!showNames)}
                    className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold rounded-full backdrop-blur-sm transition-colors"
                >
                    {showNames ? 'Ocultar nomes' : 'Mostrar nomes'}
                </button>
            )}

            {/* Face count badge */}
            {faces.length > 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    {faces.filter(f => f.profileId).length}/{faces.length} identificados
                </div>
            )}
        </div>
    )
}
