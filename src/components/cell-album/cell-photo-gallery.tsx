'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, X, Maximize2, ImageIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Photo {
    id: string
    photo_url: string
    description?: string
    created_at: string
}

interface CellPhotoGalleryProps {
    photos: any[]
}

export function CellPhotoGallery({ photos }: CellPhotoGalleryProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

    if (photos.length === 0) return null

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center gap-4 px-2">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tighter italic uppercase">Álbum de Momentos</h3>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Nossa história registrada em fotos</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                        className="group relative aspect-square rounded-[2.5rem] overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer"
                    >
                        <Image
                            src={photo.photo_url}
                            alt="Momento da célula"
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Maximize2 className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-[95vw] max-h-[90vh] p-1 bg-black/90 border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl">
                    {selectedPhoto && (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            <div className="relative w-full aspect-video md:aspect-[16/10] overflow-hidden rounded-[2.5rem] shadow-2xl">
                                <Image
                                    src={selectedPhoto}
                                    alt="Foto em destaque"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-xl border border-white/10 shadow-2xl"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
