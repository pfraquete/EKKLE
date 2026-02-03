'use client'

import { Newspaper } from 'lucide-react'

export function FeedEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Newspaper className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
                Nenhuma publicação ainda
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                Seja o primeiro a compartilhar algo com sua comunidade!
            </p>
        </div>
    )
}
