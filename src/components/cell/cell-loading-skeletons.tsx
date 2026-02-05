'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CellHeaderSkeleton() {
    return (
        <div className="relative group overflow-hidden rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-zinc-950 p-0.5 sm:p-1 shadow-xl sm:shadow-2xl animate-pulse">
            <Card className="relative border-none bg-zinc-900/50 backdrop-blur-3xl text-white rounded-2xl sm:rounded-[1.8rem] lg:rounded-[2.8rem]">
                <CardContent className="p-5 sm:p-8 lg:p-12">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32 bg-white/10" />
                        <Skeleton className="h-10 w-64 bg-white/10" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16 bg-white/10" />
                                <Skeleton className="h-4 w-24 bg-white/10" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <Skeleton className="h-10 w-40 rounded-xl bg-white/10" />
                        <Skeleton className="h-10 w-40 rounded-xl bg-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <Skeleton className="h-32 rounded-2xl bg-white/10" />
                        <Skeleton className="h-32 rounded-2xl bg-white/10" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function MembersSkeleton() {
    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </div>
            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function MeetingsSkeleton() {
    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </div>
            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function PrayerWallSkeleton() {
    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </div>
            </div>
            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20 rounded-lg" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function BirthdaysSkeleton() {
    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            </div>
            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function PhotoGallerySkeleton() {
    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </div>
            <CardContent className="p-4 sm:p-6 lg:p-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
