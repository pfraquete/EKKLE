'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerCellPhoto, deleteCellPhoto } from '@/actions/cell-album'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ImagePlus, Trash2, Loader2, Camera, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface Photo {
    id: string
    photo_url: string
    storage_path: string
    description?: string
    created_at: string
}

interface CellAlbumManagerProps {
    cellId: string
    churchId: string
    initialPhotos: any[]
}

export function CellAlbumManager({ cellId, churchId, initialPhotos }: CellAlbumManagerProps) {
    const [photos, setPhotos] = useState<any[]>(initialPhotos)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem válida.')
            return
        }

        setIsUploading(true)
        setUploadProgress(10)

        const supabase = createClient()
        const fileName = `${Date.now()}-${file.name}`
        const storagePath = `${cellId}/${fileName}`

        try {
            // 1. Upload to Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('cell-albums')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError
            setUploadProgress(50)

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('cell-albums')
                .getPublicUrl(storagePath)

            // 3. Register in DB
            const result = await registerCellPhoto({
                cellId,
                churchId,
                storagePath,
                photoUrl: publicUrl,
                description: '' // Optional for now
            })

            if (!result.success) throw new Error(result.error)

            setUploadProgress(100)
            toast.success('Foto adicionada ao álbum!')

            // Just refresh or manually append (better revalidate)
            window.location.reload()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(`Falha no upload: ${error.message}`)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleDelete = async (photoId: string) => {
        if (!confirm('Deseja realmente excluir esta foto do álbum?')) return

        try {
            const result = await deleteCellPhoto(photoId)
            if (result.success) {
                setPhotos(photos.filter(p => p.id !== photoId))
                toast.success('Foto removida.')
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao excluir foto.')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-card p-6 rounded-[2rem] border border-border/50 shadow-xl">
                <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight italic uppercase">Álbum da Célula</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Eternize os melhores momentos com sua comunidade</p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="photo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <label htmlFor="photo-upload">
                        <Button
                            asChild
                            variant="default"
                            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-xl shadow-primary/20 cursor-pointer"
                            disabled={isUploading}
                        >
                            <span>
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <ImagePlus className="w-4 h-4 mr-2" />
                                )}
                                {isUploading ? `Enviando ${uploadProgress}%` : 'Adicionar Foto'}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {photos.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-[3rem] bg-muted/20">
                    <div className="w-20 h-20 bg-muted rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                        <Camera className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest italic">Nenhuma foto no álbum ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-muted border border-border/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                            <Image
                                src={photo.photo_url}
                                alt="Foto da célula"
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    className="p-2 bg-destructive/20 hover:bg-destructive text-white rounded-xl transition-colors float-right backdrop-blur-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
