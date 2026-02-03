'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImagePlus, Video, Loader2, X, Send } from 'lucide-react'
import { createPost } from '@/actions/feed'
import { registerPostMedia, getMediaUploadUrl } from '@/actions/feed-media'
import { FeedSettings, FeedPost, canUserPost, UserRole, MediaType } from '@/types/feed'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface MediaPreview {
    file: File
    preview: string
    type: MediaType
}

interface FeedPostFormProps {
    settings: FeedSettings
    currentUserRole: string
    currentUserName: string
    currentUserPhoto: string | null
    onPostCreated?: (post: FeedPost) => void
}

export function FeedPostForm({
    settings,
    currentUserRole,
    currentUserName,
    currentUserPhoto,
    onPostCreated,
}: FeedPostFormProps) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const canPost = canUserPost(currentUserRole as UserRole, settings.min_role_to_post)

    if (!canPost) {
        return null
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const currentCount = mediaFiles.length
        const maxAllowed = settings.max_media_per_post - currentCount

        if (maxAllowed <= 0) {
            toast({
                title: 'Limite atingido',
                description: `Máximo de ${settings.max_media_per_post} arquivos por post`,
                variant: 'destructive',
            })
            return
        }

        const newFiles: MediaPreview[] = []
        const filesToProcess = Array.from(files).slice(0, maxAllowed)

        for (const file of filesToProcess) {
            const isImage = file.type.startsWith('image/')
            const isVideo = file.type.startsWith('video/')

            if (!isImage && !isVideo) {
                continue
            }

            // Check file size (50MB max)
            if (file.size > 52428800) {
                toast({
                    title: 'Arquivo muito grande',
                    description: 'O tamanho máximo é 50MB',
                    variant: 'destructive',
                })
                continue
            }

            const preview = URL.createObjectURL(file)
            newFiles.push({
                file,
                preview,
                type: isImage ? 'image' : 'video',
            })
        }

        setMediaFiles(prev => [...prev, ...newFiles])

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeMedia = (index: number) => {
        setMediaFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    const uploadMedia = async (postId: string) => {
        setIsUploading(true)

        for (let i = 0; i < mediaFiles.length; i++) {
            const media = mediaFiles[i]

            try {
                // Get signed upload URL
                const urlResult = await getMediaUploadUrl(postId, media.file.name, media.file.type)
                if (!urlResult.success || !urlResult.signedUrl) {
                    throw new Error(urlResult.error || 'Erro ao gerar URL')
                }

                // Upload file
                const uploadResponse = await fetch(urlResult.signedUrl, {
                    method: 'PUT',
                    body: media.file,
                    headers: {
                        'Content-Type': media.file.type,
                    },
                })

                if (!uploadResponse.ok) {
                    throw new Error('Erro no upload')
                }

                // Register media in database
                await registerPostMedia({
                    postId,
                    mediaType: media.type,
                    storagePath: urlResult.storagePath!,
                    mediaUrl: urlResult.publicUrl!,
                    fileName: media.file.name,
                    fileSize: media.file.size,
                    mimeType: media.file.type,
                    sortOrder: i,
                })
            } catch (error) {
                console.error('Error uploading media:', error)
                toast({
                    title: 'Erro no upload',
                    description: `Falha ao enviar ${media.file.name}`,
                    variant: 'destructive',
                })
            }
        }

        setIsUploading(false)
    }

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) {
            toast({
                title: 'Post vazio',
                description: 'Escreva algo ou adicione uma mídia',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await createPost(content)

            if (!result.success) {
                toast({
                    title: 'Erro',
                    description: result.error,
                    variant: 'destructive',
                })
                return
            }

            // Upload media if any
            if (mediaFiles.length > 0 && result.post) {
                await uploadMedia(result.post.id)
            }

            toast({
                title: 'Sucesso',
                description: result.message || 'Post criado!',
            })

            // Clear form
            setContent('')
            mediaFiles.forEach(m => URL.revokeObjectURL(m.preview))
            setMediaFiles([])

            // Callback
            if (onPostCreated && result.post) {
                onPostCreated(result.post)
            }
        } catch (error) {
            console.error('Error creating post:', error)
            toast({
                title: 'Erro',
                description: 'Falha ao criar post',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const initials = currentUserName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={currentUserPhoto || undefined} alt={currentUserName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        <Textarea
                            placeholder="O que você gostaria de compartilhar?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 text-base"
                            disabled={isSubmitting}
                        />

                        {/* Media Preview */}
                        {mediaFiles.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {mediaFiles.map((media, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
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
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                                            disabled={isSubmitting}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        {media.type === 'video' && (
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                                                <Video className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex gap-1">
                                {settings.allow_media && (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            disabled={isSubmitting || mediaFiles.length >= settings.max_media_per_post}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSubmitting || mediaFiles.length >= settings.max_media_per_post}
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <ImagePlus className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isUploading || (!content.trim() && mediaFiles.length === 0)}
                                size="sm"
                                className="rounded-full px-4"
                            >
                                {isSubmitting || isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isUploading ? 'Enviando...' : 'Publicando...'}
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Publicar
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Approval notice */}
                        {settings.require_approval && currentUserRole !== 'PASTOR' && (
                            <p className="text-xs text-muted-foreground">
                                Seu post será enviado para aprovação antes de ser publicado.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
