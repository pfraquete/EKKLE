'use client'

import { useState, useEffect } from 'react'
import { getMembersWithEmbeddings, searchPhotosByMember, MemberPhotoResult } from '@/actions/face-recognition'
import Image from 'next/image'
import { Search, User, Users, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { PhotoFaceOverlay } from './photo-face-overlay'

interface Member {
    id: string
    fullName: string
    photoUrl: string | null
}

interface MemberPhotoSearchProps {
    onFilterChange?: (memberId: string | null) => void
}

export function MemberPhotoSearch({ onFilterChange }: MemberPhotoSearchProps) {
    const [members, setMembers] = useState<Member[]>([])
    const [selectedMember, setSelectedMember] = useState<string | null>(null)
    const [photos, setPhotos] = useState<MemberPhotoResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMembers, setIsLoadingMembers] = useState(true)
    const [selectedPhoto, setSelectedPhoto] = useState<MemberPhotoResult | null>(null)

    // Load members with face embeddings
    useEffect(() => {
        async function loadMembers() {
            setIsLoadingMembers(true)
            const result = await getMembersWithEmbeddings()
            if (result.success && result.data) {
                setMembers(result.data)
            }
            setIsLoadingMembers(false)
        }

        loadMembers()
    }, [])

    // Search photos when member is selected
    useEffect(() => {
        async function searchPhotos() {
            if (!selectedMember) {
                setPhotos([])
                onFilterChange?.(null)
                return
            }

            setIsLoading(true)
            const result = await searchPhotosByMember(selectedMember)
            if (result.success && result.data) {
                setPhotos(result.data)
            }
            onFilterChange?.(selectedMember)
            setIsLoading(false)
        }

        searchPhotos()
    }, [selectedMember, onFilterChange])

    const handleClearFilter = () => {
        setSelectedMember(null)
        setPhotos([])
        onFilterChange?.(null)
    }

    const selectedMemberData = members.find(m => m.id === selectedMember)

    if (isLoadingMembers) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando membros...
            </div>
        )
    }

    if (members.length === 0) {
        return null // No members with face embeddings yet
    }

    return (
        <div className="space-y-4">
            {/* Search controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Buscar por membro:</span>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <Select
                        value={selectedMember || ''}
                        onValueChange={(value) => setSelectedMember(value || null)}
                    >
                        <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="Selecione um membro">
                                {selectedMemberData && (
                                    <div className="flex items-center gap-2">
                                        {selectedMemberData.photoUrl ? (
                                            <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                                <Image
                                                    src={selectedMemberData.photoUrl}
                                                    alt={selectedMemberData.fullName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                        <span>{selectedMemberData.fullName}</span>
                                    </div>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        {member.photoUrl ? (
                                            <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                                <Image
                                                    src={member.photoUrl}
                                                    alt={member.fullName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <span>{member.fullName}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedMember && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFilter}
                            className="h-9 w-9"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Results */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Buscando fotos...
                </div>
            )}

            {!isLoading && selectedMember && photos.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-2xl">
                    <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        Nenhuma foto encontrada com este membro
                    </p>
                </div>
            )}

            {!isLoading && selectedMember && photos.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{photos.length}</span> foto(s) encontrada(s)
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {photos.map((photo) => (
                            <button
                                key={`${photo.photoId}-${photo.boxX}-${photo.boxY}`}
                                onClick={() => setSelectedPhoto(photo)}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Image
                                    src={photo.photoUrl}
                                    alt="Foto"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Highlight the face position */}
                                <div
                                    className="absolute border-2 border-primary/60 rounded-lg"
                                    style={{
                                        left: `${photo.boxX * 100}%`,
                                        top: `${photo.boxY * 100}%`,
                                        width: `${photo.boxWidth * 100}%`,
                                        height: `${photo.boxHeight * 100}%`,
                                    }}
                                />

                                {/* Confidence badge */}
                                {photo.confidence && (
                                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-full">
                                        {Math.round(photo.confidence * 100)}%
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Photo preview dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Foto com {selectedMemberData?.fullName}</DialogTitle>
                    </DialogHeader>

                    {selectedPhoto && (
                        <div className="relative aspect-video">
                            <PhotoFaceOverlay
                                photoId={selectedPhoto.photoId}
                                photoUrl={selectedPhoto.photoUrl}
                                className="w-full h-full"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
