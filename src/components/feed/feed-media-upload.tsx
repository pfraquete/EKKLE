'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, Video, X } from 'lucide-react'
import { MediaType } from '@/types/feed'
import { cn } from '@/lib/utils'

interface MediaPreview {
    file: File
    preview: string
    type: MediaType
}

interface FeedMediaUploadProps {
    mediaFiles: MediaPreview[]
    maxFiles: number
    disabled?: boolean
    onFilesSelected: (files: MediaPreview[]) => void
    onFileRemoved: (index: number) => void
}

export function FeedMediaUpload({
    mediaFiles,
    maxFiles,
    disabled = false,
    onFilesSelected,
    onFileRemoved,
}: FeedMediaUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const currentCount = mediaFiles.length
        const maxAllowed = maxFiles - currentCount

        if (maxAllowed <= 0) return

        const newFiles: MediaPreview[] = []
        const filesToProcess = Array.from(files).slice(0, maxAllowed)

        for (const file of filesToProcess) {
            const isImage = file.type.startsWith('image/')
            const isVideo = file.type.startsWith('video/')

            if (!isImage && !isVideo) continue

            // Check file size (50MB max)
            if (file.size > 52428800) continue

            const preview = URL.createObjectURL(file)
            newFiles.push({
                file,
                preview,
                type: isImage ? 'image' : 'video',
            })
        }

        onFilesSelected(newFiles)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const canAddMore = mediaFiles.length < maxFiles

    return (
        <div className="space-y-3">
            {/* Preview grid */}
            {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {mediaFiles.map((media, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                        >
                            {media.type === 'image' ? (
                                <img
                                    src={media.preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video
                                    src={media.preview}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => onFileRemoved(index)}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {media.type === 'video' && (
                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs flex items-center">
                                    <Video className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            {canAddMore && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={disabled}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className={cn(
                            'w-full border-dashed',
                            mediaFiles.length === 0 && 'h-20'
                        )}
                    >
                        <ImagePlus className="h-5 w-5 mr-2" />
                        {mediaFiles.length === 0
                            ? 'Adicionar fotos ou vídeos'
                            : `Adicionar mais (${mediaFiles.length}/${maxFiles})`}
                    </Button>
                </>
            )}
        </div>
    )
}
