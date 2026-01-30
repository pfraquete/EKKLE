'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PlanCardProps {
    id: string
    name: string
    description?: string | null
    durationDays: number
    planType: 'SEQUENTIAL' | 'THEMATIC' | 'CHRONOLOGICAL'
    isActive?: boolean
    href?: string
    onStart?: () => void
    className?: string
}

const planTypeLabels = {
    SEQUENTIAL: 'Sequencial',
    THEMATIC: 'Tematico',
    CHRONOLOGICAL: 'Cronologico'
}

const planTypeColors = {
    SEQUENTIAL: 'bg-blue-100 text-blue-700',
    THEMATIC: 'bg-purple-100 text-purple-700',
    CHRONOLOGICAL: 'bg-green-100 text-green-700'
}

export function PlanCard({
    id,
    name,
    description,
    durationDays,
    planType,
    isActive,
    href,
    onStart,
    className
}: PlanCardProps) {
    const getDurationLabel = (days: number) => {
        if (days === 365) return '1 ano'
        if (days === 90) return '90 dias'
        if (days === 30) return '30 dias'
        if (days < 30) return `${days} dias`
        const months = Math.round(days / 30)
        return `${months} ${months === 1 ? 'mes' : 'meses'}`
    }

    const content = (
        <Card className={cn(
            'transition-all hover:shadow-md cursor-pointer group',
            isActive && 'ring-2 ring-primary',
            className
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
                    </div>
                    {isActive && (
                        <Badge variant="default" className="flex-shrink-0">
                            Ativo
                        </Badge>
                    )}
                </div>
                {description && (
                    <CardDescription className="line-clamp-2 mt-1">
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {getDurationLabel(durationDays)}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={cn('text-xs', planTypeColors[planType])}
                        >
                            {planTypeLabels[planType]}
                        </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </CardContent>
        </Card>
    )

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        )
    }

    if (onStart) {
        return (
            <div onClick={onStart}>
                {content}
            </div>
        )
    }

    return content
}
