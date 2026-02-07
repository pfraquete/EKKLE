'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BookOpen, ZoomIn, ZoomOut } from 'lucide-react'
import { getBiblePassage } from '@/actions/bible-reading'
import { getBookName } from '@/lib/bible-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

interface PassageViewerProps {
    bookId: string
    chapterStart: number
    chapterEnd?: number | null
    bibleId?: string
    className?: string
}

export function PassageViewer({
    bookId,
    chapterStart,
    chapterEnd,
    bibleId,
    className
}: PassageViewerProps) {
    const [content, setContent] = useState<string | null>(null)
    const [reference, setReference] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fontSize, setFontSize] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bible-reader-font-size')
            return saved ? parseInt(saved, 10) : 16
        }
        return 16
    })

    useEffect(() => {
        loadPassage()
    }, [bookId, chapterStart, chapterEnd, bibleId])

    const loadPassage = async () => {
        setLoading(true)
        setError(null)

        const result = await getBiblePassage(bookId, chapterStart, chapterEnd, bibleId)

        if (result.success && result.data) {
            setContent(result.data.content)
            setReference(result.data.reference)
        } else {
            setError(result.error || 'Erro ao carregar passagem')
        }

        setLoading(false)
    }

    const increaseFontSize = () => setFontSize(prev => {
        const next = Math.min(prev + 2, 24)
        localStorage.setItem('bible-reader-font-size', String(next))
        return next
    })
    const decreaseFontSize = () => setFontSize(prev => {
        const next = Math.max(prev - 2, 12)
        localStorage.setItem('bible-reader-font-size', String(next))
        return next
    })

    const displayReference = reference || (
        chapterEnd && chapterEnd !== chapterStart
            ? `${getBookName(bookId)} ${chapterStart}-${chapterEnd}`
            : `${getBookName(bookId)} ${chapterStart}`
    )

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={loadPassage}>
                        Tentar novamente
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="border-b bg-muted/30 py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {displayReference}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={decreaseFontSize}
                            disabled={fontSize <= 12}
                            className="h-8 w-8"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-8 text-center">
                            {fontSize}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={increaseFontSize}
                            disabled={fontSize >= 24}
                            className="h-8 w-8"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
                {content ? (
                    <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                    />
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        Conteúdo não disponível
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
