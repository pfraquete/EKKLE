'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronRight, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { markReadingComplete, getBiblePassage } from '@/actions/bible-reading'
import { getBookName } from '@/lib/bible-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReadingListItemProps {
    readingId: string
    dayNumber: number
    bookId: string
    chapterStart: number
    chapterEnd?: number | null
    readingTitle?: string | null
    isCompleted?: boolean
    isCurrent?: boolean
    isLocked?: boolean
    onComplete?: () => void
}

export function ReadingListItem({
    readingId,
    dayNumber,
    bookId,
    chapterStart,
    chapterEnd,
    readingTitle,
    isCompleted = false,
    isCurrent = false,
    isLocked = false,
    onComplete
}: ReadingListItemProps) {
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState<string | null>(null)
    const [loadingContent, setLoadingContent] = useState(false)
    const [completed, setCompleted] = useState(isCompleted)

    const reference = chapterEnd && chapterEnd !== chapterStart
        ? `${getBookName(bookId)} ${chapterStart}-${chapterEnd}`
        : `${getBookName(bookId)} ${chapterStart}`

    const handleLoadContent = async () => {
        if (content) return

        setLoadingContent(true)
        const result = await getBiblePassage(bookId, chapterStart, chapterEnd)

        if (result.success && result.data) {
            setContent(result.data.content)
        } else {
            toast.error(result.error || 'Erro ao carregar passagem')
        }

        setLoadingContent(false)
    }

    const handleMarkComplete = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(async () => {
            const result = await markReadingComplete(readingId)

            if (result.success) {
                setCompleted(true)
                toast.success('Leitura concluida!')
                onComplete?.()
            } else {
                toast.error(result.error || 'Erro ao marcar leitura')
            }
        })
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open)
                if (open) handleLoadContent()
            }}
        >
            <CollapsibleTrigger asChild disabled={isLocked}>
                <div
                    className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        'hover:bg-muted/50',
                        completed && 'bg-green-50 border-green-200',
                        isCurrent && !completed && 'bg-primary/5 border-primary',
                        isLocked && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <div className={cn(
                        'flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium',
                        completed
                            ? 'bg-green-600 text-white'
                            : isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                    )}>
                        {completed ? <Check className="h-4 w-4" /> : dayNumber}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">{reference}</span>
                        </div>
                        {readingTitle && (
                            <p className="text-sm text-muted-foreground truncate">
                                {readingTitle}
                            </p>
                        )}
                    </div>

                    {isCurrent && !completed && (
                        <Badge variant="default" className="flex-shrink-0">
                            Hoje
                        </Badge>
                    )}

                    <ChevronRight className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                        isOpen && 'rotate-90'
                    )} />
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="mt-2 ml-11 mr-3 mb-3">
                    <div className="border rounded-lg p-4 bg-background">
                        {loadingContent ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : content ? (
                            <>
                                <div
                                    className="prose prose-sm max-w-none dark:prose-invert max-h-64 overflow-y-auto mb-4"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                                />
                                {!completed && (
                                    <Button
                                        onClick={handleMarkComplete}
                                        disabled={isPending}
                                        className="w-full"
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Check className="h-4 w-4 mr-2" />
                                        )}
                                        Marcar como Lido
                                    </Button>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                Nao foi possivel carregar o conteudo
                            </p>
                        )}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
