'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen } from 'lucide-react'
import { getBiblePassage } from '@/actions/bible-reading'
import { BookSelector, BIBLE_BOOKS_DATA, getBookChapters, getBookName } from './book-selector'
import { VersionSelector, getVersionName } from './version-selector'
import { cn } from '@/lib/utils'

interface BibleReaderProps {
  initialBook?: string
  initialChapter?: number
  initialVersion?: string
}

export function BibleReader({ 
  initialBook = 'GEN', 
  initialChapter = 1,
  initialVersion = 'almeida'
}: BibleReaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL or props
  const urlBook = searchParams.get('livro') || initialBook
  const urlChapter = parseInt(searchParams.get('capitulo') || String(initialChapter), 10)
  const urlVersion = searchParams.get('versao') || initialVersion

  const [book, setBook] = useState(urlBook)
  const [chapter, setChapter] = useState(urlChapter)
  const [version, setVersion] = useState(urlVersion)
  const [content, setContent] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(16)

  const maxChapters = getBookChapters(book)

  // Update URL when book/chapter/version changes
  const updateUrl = useCallback((newBook: string, newChapter: number, newVersion: string) => {
    const params = new URLSearchParams()
    params.set('livro', newBook)
    params.set('capitulo', String(newChapter))
    params.set('versao', newVersion)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router])

  // Load passage
  const loadPassage = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getBiblePassage(book, chapter, null, version)

    if (result.success && result.data) {
      setContent(result.data.content)
      setReference(result.data.reference)
    } else {
      setError(result.error || 'Erro ao carregar passagem')
    }

    setLoading(false)
  }, [book, chapter, version])

  // Load on mount and when book/chapter/version changes
  useEffect(() => {
    loadPassage()
  }, [loadPassage])

  // Handle book change
  const handleBookChange = (newBook: string) => {
    setBook(newBook)
    setChapter(1) // Reset to chapter 1 when changing books
    updateUrl(newBook, 1, version)
  }

  // Handle chapter change
  const handleChapterChange = (newChapter: number) => {
    if (newChapter >= 1 && newChapter <= maxChapters) {
      setChapter(newChapter)
      updateUrl(book, newChapter, version)
    }
  }

  // Handle version change
  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion)
    updateUrl(book, chapter, newVersion)
  }

  // Navigation
  const goToPreviousChapter = () => {
    if (chapter > 1) {
      handleChapterChange(chapter - 1)
    } else {
      // Go to previous book's last chapter
      const currentIndex = BIBLE_BOOKS_DATA.findIndex(b => b.id === book)
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS_DATA[currentIndex - 1]
        setBook(prevBook.id)
        setChapter(prevBook.chapters)
        updateUrl(prevBook.id, prevBook.chapters, version)
      }
    }
  }

  const goToNextChapter = () => {
    if (chapter < maxChapters) {
      handleChapterChange(chapter + 1)
    } else {
      // Go to next book's first chapter
      const currentIndex = BIBLE_BOOKS_DATA.findIndex(b => b.id === book)
      if (currentIndex < BIBLE_BOOKS_DATA.length - 1) {
        const nextBook = BIBLE_BOOKS_DATA[currentIndex + 1]
        setBook(nextBook.id)
        setChapter(1)
        updateUrl(nextBook.id, 1, version)
      }
    }
  }

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12))

  // Check if at beginning or end
  const isFirstChapter = book === 'GEN' && chapter === 1
  const isLastChapter = book === 'REV' && chapter === 22

  // Generate chapter options
  const chapterOptions = Array.from({ length: maxChapters }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Book Selector */}
            <BookSelector
              selectedBook={book}
              onSelectBook={handleBookChange}
              className="w-full sm:w-auto"
            />

            {/* Chapter Selector */}
            <Select
              value={String(chapter)}
              onValueChange={(v) => handleChapterChange(parseInt(v, 10))}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Capitulo" />
              </SelectTrigger>
              <SelectContent>
                {chapterOptions.map(ch => (
                  <SelectItem key={ch} value={String(ch)}>
                    Capitulo {ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Version Selector */}
            <VersionSelector
              selectedVersion={version}
              onSelectVersion={handleVersionChange}
              className="w-full sm:w-[140px]"
            />

            {/* Spacer */}
            <div className="flex-1 hidden sm:block" />

            {/* Font Size Controls */}
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
        </CardContent>
      </Card>

      {/* Content Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />
              {reference || `${getBookName(book)} ${chapter}`}
            </div>
            <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded">
              {getVersionName(version)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={loadPassage}>
                Tentar novamente
              </Button>
            </div>
          ) : content ? (
            <div
              className="p-6 prose prose-sm max-w-none dark:prose-invert"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Conteudo nao disponivel
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chapter Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousChapter}
          disabled={isFirstChapter || loading}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <span className="text-sm text-muted-foreground">
          {getBookName(book)} {chapter}
        </span>

        <Button
          variant="outline"
          onClick={goToNextChapter}
          disabled={isLastChapter || loading}
          className="gap-2"
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
