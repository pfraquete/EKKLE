'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerCellPhoto, deleteCellPhoto, updateCellPhoto } from '@/actions/cell-album'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ImagePlus, Trash2, Loader2, Camera, X, Pencil, Calendar, MessageSquare, Scan, Users } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useFaceRecognition } from '@/hooks/use-face-recognition'

interface Photo {
    id: string
    photo_url: string
    storage_path: string
    description?: string | null
    photo_date?: string | null
    created_at: string
    uploader?: { full_name: string }
    face_processed?: boolean
    face_count?: number
}

interface CellAlbumManagerProps {
    cellId: string
    churchId: string
    initialPhotos: Photo[]
}

export function CellAlbumManager({ cellId, churchId, initialPhotos }: CellAlbumManagerProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Upload dialog state
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadDescription, setUploadDescription] = useState('')
    const [uploadDate, setUploadDate] = useState('')

    // Edit dialog state
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
    const [editDescription, setEditDescription] = useState('')
    const [editDate, setEditDate] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    // Face recognition
    const {
        isProcessing: isProcessingFaces,
        progress: faceProgress,
        processAlbumPhoto,
        loadModels,
        modelsReady,
    } = useFaceRecognition()
    const [processingPhotoId, setProcessingPhotoId] = useState<string | null>(null)

    // Preload face recognition models when component mounts
    useEffect(() => {
        loadModels()
    }, [loadModels])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem válida.')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 10MB.')
            return
        }

        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)

        setShowUploadDialog(true)
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setUploadProgress(10)

        const supabase = createClient()
        const fileName = `${Date.now()}-${selectedFile.name}`
        const storagePath = `${cellId}/${fileName}`

        try {
            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('cell-albums')
                .upload(storagePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError
            setUploadProgress(50)

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('cell-albums')
                .getPublicUrl(storagePath)

            // 3. Register in DB with optional description and date
            const result = await registerCellPhoto({
                cellId,
                churchId,
                storagePath,
                photoUrl: publicUrl,
                description: uploadDescription.trim() || undefined,
                photoDate: uploadDate || undefined
            })

            if (!result.success) throw new Error(result.error)

            setUploadProgress(70)

            // 4. Process face recognition (async, don't block)
            if (result.photoId && modelsReady) {
                setProcessingPhotoId(result.photoId)
                processAlbumPhoto(result.photoId, publicUrl)
                    .then((faceResult) => {
                        if (faceResult.success && faceResult.faceCount > 0) {
                            toast.success(`${faceResult.faceCount} rosto(s) detectado(s), ${faceResult.matchedCount} identificado(s)`)
                        }
                    })
                    .catch(console.error)
                    .finally(() => setProcessingPhotoId(null))
            }

            setUploadProgress(100)
            toast.success('Foto adicionada ao álbum!')

            // Reset and close dialog
            handleCloseUploadDialog()

            // Refresh page to show new photo
            window.location.reload()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(`Falha no upload: ${error.message}`)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleCloseUploadDialog = () => {
        setShowUploadDialog(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        setUploadDescription('')
        setUploadDate('')
    }

    const handleEditPhoto = (photo: Photo) => {
        setEditingPhoto(photo)
        setEditDescription(photo.description || '')
        setEditDate(photo.photo_date || '')
        setShowEditDialog(true)
    }

    const handleSaveEdit = async () => {
        if (!editingPhoto) return

        setIsUpdating(true)

        try {
            const result = await updateCellPhoto({
                photoId: editingPhoto.id,
                description: editDescription.trim() || undefined,
                photoDate: editDate || null
            })

            if (!result.success) throw new Error(result.error)

            // Update local state
            setPhotos(photos.map(p =>
                p.id === editingPhoto.id
                    ? { ...p, description: editDescription.trim() || null, photo_date: editDate || null }
                    : p
            ))

            toast.success('Foto atualizada!')
            setShowEditDialog(false)
            setEditingPhoto(null)
        } catch (error: any) {
            toast.error(`Erro ao atualizar: ${error.message}`)
        } finally {
            setIsUpdating(false)
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
        } catch {
            toast.error('Erro ao excluir foto.')
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border/50 shadow-xl">
                <div>
                    <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight italic uppercase">Álbum da Célula</h3>
                    <p className="text-xs sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Eternize os melhores momentos</p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="photo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    <label htmlFor="photo-upload">
                        <Button
                            asChild
                            variant="default"
                            className="w-full sm:w-auto rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest h-11 sm:h-12 px-4 sm:px-6 shadow-xl shadow-primary/20 cursor-pointer"
                            disabled={isUploading}
                        >
                            <span>
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Adicionar Foto
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {photos.length === 0 ? (
                <div className="py-12 sm:py-20 text-center border-2 border-dashed border-border/60 rounded-2xl sm:rounded-[3rem] bg-muted/20">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-widest italic">Nenhuma foto no álbum ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square rounded-xl sm:rounded-[2rem] overflow-hidden bg-muted border border-border/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                            <Image
                                src={photo.photo_url}
                                alt={photo.description || 'Foto da célula'}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />

                            {/* Face count badge */}
                            {photo.face_processed && photo.face_count !== undefined && photo.face_count > 0 && (
                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1">
                                    <Users className="w-3 h-3 text-white" />
                                    <span className="text-xs sm:text-xs font-bold text-white">{photo.face_count}</span>
                                </div>
                            )}

                            {/* Processing indicator */}
                            {processingPhotoId === photo.id && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                    <Scan className="w-8 h-8 text-white animate-pulse" />
                                    <span className="text-xs text-white font-bold">Detectando rostos...</span>
                                    <div className="w-24 h-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-300"
                                            style={{ width: `${faceProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Photo info overlay */}
                            {(photo.description || photo.photo_date) && (
                                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                    {photo.photo_date && (
                                        <div className="flex items-center gap-1 text-white/80 text-xs sm:text-xs font-bold mb-0.5 sm:mb-1">
                                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            {formatDate(photo.photo_date)}
                                        </div>
                                    )}
                                    {photo.description && (
                                        <p className="text-white text-xs sm:text-xs font-medium line-clamp-2">{photo.description}</p>
                                    )}
                                </div>
                            )}

                            {/* Action buttons overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleEditPhoto(photo)}
                                    className="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg sm:rounded-xl transition-colors backdrop-blur-md"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    className="p-2 sm:p-2.5 bg-destructive/20 hover:bg-destructive text-white rounded-lg sm:rounded-xl transition-colors backdrop-blur-md"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Adicionar Foto</DialogTitle>
                        <DialogDescription>
                            Adicione uma descrição e data para a foto (opcional)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Preview */}
                        {previewUrl && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                />
                                <button
                                    onClick={handleCloseUploadDialog}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                                    aria-label="Fechar"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        {/* Date field */}
                        <div className="space-y-2">
                            <Label htmlFor="photo-date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Data da Foto (opcional)
                            </Label>
                            <Input
                                id="photo-date"
                                type="date"
                                value={uploadDate}
                                onChange={(e) => setUploadDate(e.target.value)}
                                className="h-11 rounded-xl"
                            />
                        </div>

                        {/* Description field */}
                        <div className="space-y-2">
                            <Label htmlFor="photo-description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comentário (opcional)
                            </Label>
                            <Textarea
                                id="photo-description"
                                placeholder="Descreva este momento especial..."
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                className="min-h-[80px] rounded-xl resize-none"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {uploadDescription.length}/500
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 rounded-xl font-bold"
                                onClick={handleCloseUploadDialog}
                                disabled={isUploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-bold"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando {uploadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <ImagePlus className="w-4 h-4 mr-2" />
                                        Salvar Foto
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Editar Foto</DialogTitle>
                        <DialogDescription>
                            Atualize a descrição e data da foto
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Photo Preview */}
                        {editingPhoto && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                                <Image
                                    src={editingPhoto.photo_url}
                                    alt="Foto"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {/* Date field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-photo-date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Data da Foto (opcional)
                            </Label>
                            <Input
                                id="edit-photo-date"
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="h-11 rounded-xl"
                            />
                        </div>

                        {/* Description field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-photo-description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comentário (opcional)
                            </Label>
                            <Textarea
                                id="edit-photo-description"
                                placeholder="Descreva este momento especial..."
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="min-h-[80px] rounded-xl resize-none"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {editDescription.length}/500
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 rounded-xl font-bold"
                                onClick={() => setShowEditDialog(false)}
                                disabled={isUpdating}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 h-11 rounded-xl font-bold"
                                onClick={handleSaveEdit}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
