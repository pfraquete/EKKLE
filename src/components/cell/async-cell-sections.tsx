import { getCellPhotosOptimized, getCellPrayerRequestsOptimized } from '@/actions/cell-optimized'
import { getCellPhotos } from '@/actions/cell-album'
import { getCellPrayerRequests } from '@/actions/cell-prayer'
import { CellPhotoGallery } from '@/components/cell-album/cell-photo-gallery'
import { PrayerWall } from '@/components/cell-prayer/prayer-wall'
import { CellBirthdays } from '@/components/cell-prayer/cell-birthdays'

interface AsyncPrayerWallProps {
    cellId: string
    currentUserId: string
}

/**
 * Async component for Prayer Wall - loads independently with Suspense
 */
export async function AsyncPrayerWall({ cellId, currentUserId }: AsyncPrayerWallProps) {
    // Try optimized function first, fallback to regular
    let prayerRequests = null
    
    const optimizedResult = await getCellPrayerRequestsOptimized(cellId)
    if (optimizedResult.data) {
        prayerRequests = optimizedResult.data
    } else {
        // Fallback to regular function
        const regularResult = await getCellPrayerRequests(cellId)
        prayerRequests = regularResult.data || []
    }
    
    return (
        <PrayerWall 
            cellId={cellId} 
            initialRequests={prayerRequests} 
            currentUserId={currentUserId}
        />
    )
}

interface AsyncBirthdaysProps {
    members: {
        id: string
        full_name: string
        photo_url: string | null
        birth_date: string | null
    }[]
}

/**
 * Async component for Birthdays - loads independently with Suspense
 */
export async function AsyncBirthdays({ members }: AsyncBirthdaysProps) {
    // This component doesn't need additional data fetching
    // but wrapping it allows for consistent loading behavior
    return <CellBirthdays members={members} />
}

interface AsyncPhotoGalleryProps {
    cellId: string
}

/**
 * Async component for Photo Gallery - loads independently with Suspense
 */
export async function AsyncPhotoGallery({ cellId }: AsyncPhotoGalleryProps) {
    // Try optimized function first, fallback to regular
    let photos = null
    
    const optimizedResult = await getCellPhotosOptimized(cellId)
    if (optimizedResult.data) {
        photos = optimizedResult.data
    } else {
        // Fallback to regular function
        const regularResult = await getCellPhotos(cellId)
        photos = regularResult.data || []
    }
    
    return <CellPhotoGallery photos={photos} />
}
