import { getMemberCellData } from '@/actions/cell'
import { getProfile } from '@/actions/auth'
import { getCellPhotos } from '@/actions/cell-album'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { CellAlbumManager } from '@/components/cell-album/cell-album-manager'
import { CellPhotoGallery } from '@/components/cell-album/cell-photo-gallery'

export default async function AlbumPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const data = await getMemberCellData()
    if (!data) redirect('/membro/minha-celula')

    const { cell } = data
    const { data: photos } = await getCellPhotos(cell.id)
    const isLeader = profile.role === 'LEADER'

    return (
        <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/membro/minha-celula">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Álbum de Fotos</h1>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            {cell.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Album Content */}
            {isLeader ? (
                // Leaders can upload and manage photos
                <CellAlbumManager
                    cellId={cell.id}
                    churchId={profile.church_id}
                    initialPhotos={photos || []}
                />
            ) : (
                // Members can only view photos
                <div className="space-y-6">
                    {(!photos || photos.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-muted">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground font-bold italic">
                                Nenhuma foto no álbum ainda.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                O líder da célula pode adicionar fotos.
                            </p>
                        </div>
                    ) : (
                        <CellPhotoGallery photos={photos} />
                    )}
                </div>
            )}
        </div>
    )
}
