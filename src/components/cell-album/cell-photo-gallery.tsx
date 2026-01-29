'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Maximize2, ImageIcon, Calendar, MessageSquare, Users } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MemberPhotoSearch } from '@/components/face-recognition/member-photo-search'
import { PhotoFaceOverlay } from '@/components/face-recognition/photo-face-overlay'
import { getPhotoDetections, PhotoFaceResult } from '@/actions/face-recognition'

interface Photo {
    id: string
    photo_url: string
    description?: string | null
    photo_date?: string | null
    created_at: string
    uploader?: { full_name: string }
    face_processed?: boolean
    face_count?: number
}

interface CellPhotoGalleryProps {
    photos: Photo[]
    showFaceSearch?: boolean
}

export function CellPhotoGallery({ photos, showFaceSearch = true }: CellPhotoGalleryProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
    const [filteredMemberId, setFilteredMemberId] = useState<string | null>(null)
    const [photoFaces, setPhotoFaces] = useState<PhotoFaceResult[]>([])
    const [showFaceOverlay, setShowFaceOverlay] = useState(true)

    // Load faces when a photo is selected
    useEffect(() => {
        async function loadFaces() {
            if (selectedPhoto) {
                const result = await getPhotoDetections(selectedPhoto.id)
                if (result.success && result.data) {
                    setPhotoFaces(result.data)
                } else {
                    setPhotoFaces([])
                }
            } else {
                setPhotoFaces([])
            }
        }

        loadFaces()
    }, [selectedPhoto])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    // Check if any photo has face data
    const hasFaceData = photos.some(p => p.face_processed && (p.face_count || 0) > 0)

    if (photos.length === 0) return null

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center gap-3 sm:gap-4 px-2">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                    <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter italic uppercase">Álbum de Momentos</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest">Nossa história registrada em fotos</p>
                </div>
            </div>

            {/* Face search */}
            {showFaceSearch && hasFaceData && (
                <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                    <MemberPhotoSearch onFilterChange={setFilteredMemberId} />
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        className="group relative aspect-square rounded-xl sm:rounded-[2.5rem] overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer"
                    >
                        <Image
                            src={photo.photo_url}
                            alt={photo.description || 'Momento da célula'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Face count badge */}
                        {photo.face_processed && photo.face_count !== undefined && photo.face_count > 0 && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1 z-10">
                                <Users className="w-3 h-3 text-white" />
                                <span className="text-[10px] sm:text-xs font-bold text-white">{photo.face_count}</span>
                            </div>
                        )}

                        {/* Photo info overlay */}
                        {(photo.description || photo.photo_date) && (
                            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                {photo.photo_date && (
                                    <div className="flex items-center gap-1 text-white/80 text-[9px] sm:text-[10px] font-bold mb-0.5 sm:mb-1">
                                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        {formatDate(photo.photo_date)}
                                    </div>
                                )}
                                {photo.description && (
                                    <p className="text-white text-[10px] sm:text-xs font-medium line-clamp-2">{photo.description}</p>
                                )}
                            </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Maximize2 className="w-6 h-6 sm:w-8 sm:h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-[95vw] max-h-[90vh] p-1 bg-black/90 border-white/10 rounded-2xl sm:rounded-[3rem] overflow-hidden backdrop-blur-3xl">
                    {selectedPhoto && (
                        <div className="relative w-full h-full flex flex-col">
                            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4">
                                <div className="relative w-full aspect-video md:aspect-[16/10] overflow-hidden rounded-xl sm:rounded-[2.5rem] shadow-2xl">
                                    <Image
                                        src={selectedPhoto.photo_url}
                                        alt={selectedPhoto.description || 'Foto em destaque'}
                                        fill
                                        className="object-contain"
                                        priority
                                    />

                                    {/* Face detection overlay */}
                                    {showFaceOverlay && photoFaces.map((face) => (
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
                                            {face.fullName && (
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                                    <div className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg">
                                                        {face.fullName}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Unknown face indicator */}
                                            {!face.profileId && (
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                                    <div className="px-2 py-0.5 bg-white/80 text-black/80 text-[10px] font-bold rounded-full shadow-lg">
                                                        Desconhecido
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2">
                                    {/* Toggle face overlay */}
                                    {photoFaces.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowFaceOverlay(!showFaceOverlay)
                                            }}
                                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-2"
                                        >
                                            <Users className="w-4 h-4" />
                                            {showFaceOverlay ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedPhoto(null)}
                                        className="p-3 sm:p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-xl border border-white/10 shadow-2xl"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>

                                {/* Face count badge */}
                                {photoFaces.length > 0 && (
                                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                        {photoFaces.filter(f => f.profileId).length}/{photoFaces.length} identificados
                                    </div>
                                )}
                            </div>

                            {/* Photo details */}
                            {(selectedPhoto.description || selectedPhoto.photo_date) && (
                                <div className="p-4 sm:p-6 bg-black/50 border-t border-white/10">
                                    {selectedPhoto.photo_date && (
                                        <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm font-bold mb-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(selectedPhoto.photo_date)}
                                        </div>
                                    )}
                                    {selectedPhoto.description && (
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                                            <p className="text-white/90 text-sm sm:text-base">{selectedPhoto.description}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
