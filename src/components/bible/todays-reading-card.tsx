'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Check, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { markReadingComplete, getBiblePassage } from '@/actions/bible-reading'
import { getBookName } from '@/lib/bible-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TodaysReadingCardProps {
    readingId: string
    dayNumber: number
    bookId: string
    chapterStart: number
    chapterEnd?: number | null
    readingTitle?: string | null
    isCompleted?: boolean
    onComplete?: (newStreak: number) => void
    className?: string
}

export function TodaysReadingCard({
    readingId,
    dayNumber,
    bookId,
    chapterStart,
    chapterEnd,
    readingTitle,
    isCompleted = false,
    onComplete,
    className
}: TodaysReadingCardProps) {
    const [isPending, startTransition] = useTransition()
    const [showContent, setShowContent] = useState(false)
    const [content, setContent] = useState<string | null>(null)
    const [loadingContent, setLoadingContent] = useState(false)
    const [completed, setCompleted] = useState(isCompleted)

    const reference = chapterEnd && chapterEnd !== chapterStart
        ? `${getBookName(bookId)} ${chapterStart}-${chapterEnd}`
        : `${getBookName(bookId)} ${chapterStart}`

    const handleLoadContent = async () => {
        if (content) {
            setShowContent(!showContent)
            return
        }

        setLoadingContent(true)
        setShowContent(true)

        const result = await getBiblePassage(bookId, chapterStart, chapterEnd)

        if (result.success && result.data) {
            setContent(result.data.content)
        } else {
            toast.error(result.error || 'Erro ao carregar passagem')
            setShowContent(false)
        }

        setLoadingContent(false)
    }

    const handleMarkComplete = () => {
        startTransition(async () => {
            const result = await markReadingComplete(readingId)

            if (result.success) {
                setCompleted(true)
                toast.success('Leitura marcada como concluida!')
                onComplete?.(result.data?.newStreak || 1)
            } else {
                toast.error(result.error || 'Erro ao marcar leitura')
            }
        })
    }

    return (
        <Card className={cn(
            'overflow-hidden',
            completed && 'bg-green-50 border-green-200',
            className
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                                Dia {dayNumber}
                            </Badge>
                            {completed && (
                                <Badge variant="default" className="bg-green-600 text-xs gap-1">
                                    <Check className="h-3 w-3" />
                                    Concluido
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {reference}
                        </CardTitle>
                        {readingTitle && (
                            <CardDescription className="mt-1">
                                {readingTitle}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showContent && (
                    <div className="border rounded-lg p-4 bg-background max-h-96 overflow-y-auto">
                        {loadingContent ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : content ? (
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                            />
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                Nao foi possivel carregar o conteudo
                            </p>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleLoadContent}
                        className="flex-1"
                    >
                        {showContent ? 'Ocultar' : 'Ler Passagem'}
                        <ChevronRight className={cn(
                            'ml-2 h-4 w-4 transition-transform',
                            showContent && 'rotate-90'
                        )} />
                    </Button>

                    {!completed && (
                        <Button
                            onClick={handleMarkComplete}
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Marcar como Lido
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
