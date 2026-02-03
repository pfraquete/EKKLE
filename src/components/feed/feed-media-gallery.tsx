'use client'

import { useState } from 'react'
import { FeedPostMedia } from '@/types/feed'
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedMediaGalleryProps {
    media: FeedPostMedia[]
    className?: string
}

export function FeedMediaGallery({ media, className }: FeedMediaGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    if (!media || media.length === 0) return null

    // Sort by sort_order
    const sortedMedia = [...media].sort((a, b) => a.sort_order - b.sort_order)

    const openLightbox = (index: number) => {
        setSelectedIndex(index)
    }

    const closeLightbox = () => {
        setSelectedIndex(null)
    }

    const goToPrevious = () => {
        if (selectedIndex === null) return
        setSelectedIndex(selectedIndex === 0 ? sortedMedia.length - 1 : selectedIndex - 1)
    }

    const goToNext = () => {
        if (selectedIndex === null) return
        setSelectedIndex(selectedIndex === sortedMedia.length - 1 ? 0 : selectedIndex + 1)
    }

    // Grid layout based on number of items
    const getGridClass = () => {
        switch (sortedMedia.length) {
            case 1:
                return 'grid-cols-1'
            case 2:
                return 'grid-cols-2'
            case 3:
                return 'grid-cols-2'
            case 4:
                return 'grid-cols-2'
            default:
                return 'grid-cols-3'
        }
    }

    return (
        <>
            <div className={cn('grid gap-1 rounded-xl overflow-hidden', getGridClass(), className)}>
                {sortedMedia.slice(0, 6).map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            'relative cursor-pointer overflow-hidden bg-muted',
                            sortedMedia.length === 1 ? 'aspect-video max-h-[400px]' : 'aspect-square',
                            sortedMedia.length === 3 && index === 0 && 'row-span-2',
                        )}
                        onClick={() => openLightbox(index)}
                    >
                        {item.media_type === 'image' ? (
                            <img
                                src={item.media_url}
                                alt={item.file_name || 'Image'}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                        ) : (
                            <div className="relative w-full h-full">
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.file_name || 'Video thumbnail'}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <video
                                        src={item.media_url}
                                        className="w-full h-full object-cover"
                                        muted
                                        preload="metadata"
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                        <Play className="h-6 w-6 text-white fill-white ml-1" />
                                    </div>
                                </div>
                                {item.duration_seconds && (
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-white text-xs font-medium">
                                        {formatDuration(item.duration_seconds)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show +N overlay for more items */}
                        {index === 5 && sortedMedia.length > 6 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                    +{sortedMedia.length - 6}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
                        onClick={closeLightbox}
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Navigation buttons */}
                    {sortedMedia.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToPrevious()
                                }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToNext()
                                }}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}

                    {/* Media content */}
                    <div
                        className="max-w-[90vw] max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sortedMedia[selectedIndex].media_type === 'image' ? (
                            <img
                                src={sortedMedia[selectedIndex].media_url}
                                alt={sortedMedia[selectedIndex].file_name || 'Image'}
                                className="max-w-full max-h-[90vh] object-contain"
                            />
                        ) : (
                            <video
                                src={sortedMedia[selectedIndex].media_url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[90vh]"
                            />
                        )}
                    </div>

                    {/* Counter */}
                    {sortedMedia.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
                            {selectedIndex + 1} / {sortedMedia.length}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}
