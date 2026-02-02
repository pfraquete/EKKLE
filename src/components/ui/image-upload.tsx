'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ImageIcon, Loader2, X, UploadCloud } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    bucket: 'event-images' | 'course-images' | 'church-assets'
    folder?: string
    className?: string
    aspectRatio?: 'video' | 'square' | 'rect'
    label?: string
}

export function ImageUpload({
    value,
    onChange,
    bucket,
    folder = 'general',
    className,
    aspectRatio = 'video',
    label = 'Imagem'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem válida.')
            return
        }

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 5MB.')
            return
        }

        setIsUploading(true)

        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const storagePath = `${folder}/${fileName}`

        try {
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(storagePath)

            onChange(publicUrl)
            toast.success('Upload concluído!')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(`Falha no upload: ${error.message}`)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemove = () => {
        onChange('')
    }

    const aspectClasses = {
        video: 'aspect-video',
        square: 'aspect-square',
        rect: 'aspect-[4/3]'
    }

    return (
        <div className={cn("space-y-3", className)}>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">
                {label}
            </label>

            <div
                className={cn(
                    "relative group border-2 border-dashed border-border/40 rounded-[2rem] overflow-hidden bg-muted/20 hover:bg-muted/30 transition-all duration-300",
                    aspectClasses[aspectRatio],
                    !value && "flex flex-col items-center justify-center cursor-pointer"
                )}
                onClick={() => !value && !isUploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                />

                {value ? (
                    <>
                        <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 px-4"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                Alterar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 px-4"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemove()
                                }}
                                disabled={isUploading}
                            >
                                Remover
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-6 flex flex-col items-center">
                        {isUploading ? (
                            <>
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Enviando...</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-muted rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <UploadCloud className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                    Clique para Escolher ou Arraste
                                </p>
                                <p className="text-xs text-muted-foreground/40 mt-2 font-bold group-hover:text-primary/40 transition-colors uppercase tracking-[0.1em]">
                                    PNG, JPG ou WEBP (Max. 5MB)
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
