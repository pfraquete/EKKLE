'use client'

import { Card, CardContent } from '@/components/ui/card'

interface GenderStatsWidgetProps {
    maleCount: number
    femaleCount: number
}

export function GenderStatsWidget({ maleCount, femaleCount }: GenderStatsWidgetProps) {
    const total = maleCount + femaleCount

    if (total === 0) {
        return null
    }

    const malePercent = Math.round((maleCount / total) * 100)
    const femalePercent = 100 - malePercent

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                    Distribuicao por Genero
                </p>

                {/* Progress bar */}
                <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-3">
                    <div
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${malePercent}%` }}
                    />
                    <div
                        className="bg-pink-500 transition-all duration-500"
                        style={{ width: `${femalePercent}%` }}
                    />
                </div>

                {/* Legend */}
                <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Meninos</span>
                        <span className="font-semibold">{maleCount}</span>
                        <span className="text-muted-foreground">({malePercent}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span className="text-muted-foreground">Meninas</span>
                        <span className="font-semibold">{femaleCount}</span>
                        <span className="text-muted-foreground">({femalePercent}%)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
