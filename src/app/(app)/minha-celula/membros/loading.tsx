import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus } from 'lucide-react'

export default function Loading() {
    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full" disabled>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Membros</h1>
                </div>
                <Button size="icon" className="rounded-full h-10 w-10 shadow-lg" disabled>
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Search Bar Skeleton */}
            <Skeleton className="h-12 w-full rounded-2xl" />

            {/* Filter Badges Skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            {/* Members List Skeleton */}
            <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
