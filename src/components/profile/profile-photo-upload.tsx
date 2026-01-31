'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, Loader2, User, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface ProfilePhotoUploadProps {
    currentPhotoUrl: string | null
    userName: string
}

export function ProfilePhotoUpload({ currentPhotoUrl, userName }: ProfilePhotoUploadProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione uma imagem válida')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB')
            return
        }

        setError(null)
        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('avatar', selectedFile)
            formData.append('fullName', userName)
            formData.append('currentPhotoUrl', currentPhotoUrl || '')

            const response = await fetch('/api/profile/upload-photo', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer upload')
            }

            // Success - close dialog and refresh
            setIsOpen(false)
            setPreviewUrl(null)
            setSelectedFile(null)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto')
        } finally {
            setIsUploading(false)
        }
    }

    const handleCancel = () => {
        setPreviewUrl(null)
        setSelectedFile(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            handleCancel()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                        {currentPhotoUrl ? (
                            <Image
                                src={currentPhotoUrl}
                                alt={userName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-2xl sm:rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                    </div>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Foto de Perfil</DialogTitle>
                    <DialogDescription>
                        Escolha uma foto para o seu perfil. A imagem deve ter no máximo 5MB.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Preview Area */}
                    <div className="flex justify-center">
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center">
                            {previewUrl ? (
                                <>
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={handleCancel}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                                        aria-label="Cancelar"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            ) : currentPhotoUrl ? (
                                <Image
                                    src={currentPhotoUrl}
                                    alt={userName}
                                    fill
                                    className="object-cover opacity-50"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/40 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Clique para selecionar
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-upload"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {!previewUrl ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 rounded-xl font-bold"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Escolher Foto
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11 rounded-xl font-bold"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    Trocar
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
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Salvar Foto
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
