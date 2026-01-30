'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChevronDown, Book } from 'lucide-react'
import { cn } from '@/lib/utils'

// Bible books with chapter counts
export const BIBLE_BOOKS_DATA = [
  // Old Testament
  { id: 'GEN', name: 'Genesis', chapters: 50, testament: 'old' },
  { id: 'EXO', name: 'Exodo', chapters: 40, testament: 'old' },
  { id: 'LEV', name: 'Levitico', chapters: 27, testament: 'old' },
  { id: 'NUM', name: 'Numeros', chapters: 36, testament: 'old' },
  { id: 'DEU', name: 'Deuteronomio', chapters: 34, testament: 'old' },
  { id: 'JOS', name: 'Josue', chapters: 24, testament: 'old' },
  { id: 'JDG', name: 'Juizes', chapters: 21, testament: 'old' },
  { id: 'RUT', name: 'Rute', chapters: 4, testament: 'old' },
  { id: '1SA', name: '1 Samuel', chapters: 31, testament: 'old' },
  { id: '2SA', name: '2 Samuel', chapters: 24, testament: 'old' },
  { id: '1KI', name: '1 Reis', chapters: 22, testament: 'old' },
  { id: '2KI', name: '2 Reis', chapters: 25, testament: 'old' },
  { id: '1CH', name: '1 Cronicas', chapters: 29, testament: 'old' },
  { id: '2CH', name: '2 Cronicas', chapters: 36, testament: 'old' },
  { id: 'EZR', name: 'Esdras', chapters: 10, testament: 'old' },
  { id: 'NEH', name: 'Neemias', chapters: 13, testament: 'old' },
  { id: 'EST', name: 'Ester', chapters: 10, testament: 'old' },
  { id: 'JOB', name: 'Jo', chapters: 42, testament: 'old' },
  { id: 'PSA', name: 'Salmos', chapters: 150, testament: 'old' },
  { id: 'PRO', name: 'Proverbios', chapters: 31, testament: 'old' },
  { id: 'ECC', name: 'Eclesiastes', chapters: 12, testament: 'old' },
  { id: 'SNG', name: 'Canticos', chapters: 8, testament: 'old' },
  { id: 'ISA', name: 'Isaias', chapters: 66, testament: 'old' },
  { id: 'JER', name: 'Jeremias', chapters: 52, testament: 'old' },
  { id: 'LAM', name: 'Lamentacoes', chapters: 5, testament: 'old' },
  { id: 'EZK', name: 'Ezequiel', chapters: 48, testament: 'old' },
  { id: 'DAN', name: 'Daniel', chapters: 12, testament: 'old' },
  { id: 'HOS', name: 'Oseias', chapters: 14, testament: 'old' },
  { id: 'JOL', name: 'Joel', chapters: 3, testament: 'old' },
  { id: 'AMO', name: 'Amos', chapters: 9, testament: 'old' },
  { id: 'OBA', name: 'Obadias', chapters: 1, testament: 'old' },
  { id: 'JON', name: 'Jonas', chapters: 4, testament: 'old' },
  { id: 'MIC', name: 'Miqueias', chapters: 7, testament: 'old' },
  { id: 'NAM', name: 'Naum', chapters: 3, testament: 'old' },
  { id: 'HAB', name: 'Habacuque', chapters: 3, testament: 'old' },
  { id: 'ZEP', name: 'Sofonias', chapters: 3, testament: 'old' },
  { id: 'HAG', name: 'Ageu', chapters: 2, testament: 'old' },
  { id: 'ZEC', name: 'Zacarias', chapters: 14, testament: 'old' },
  { id: 'MAL', name: 'Malaquias', chapters: 4, testament: 'old' },
  // New Testament
  { id: 'MAT', name: 'Mateus', chapters: 28, testament: 'new' },
  { id: 'MRK', name: 'Marcos', chapters: 16, testament: 'new' },
  { id: 'LUK', name: 'Lucas', chapters: 24, testament: 'new' },
  { id: 'JHN', name: 'Joao', chapters: 21, testament: 'new' },
  { id: 'ACT', name: 'Atos', chapters: 28, testament: 'new' },
  { id: 'ROM', name: 'Romanos', chapters: 16, testament: 'new' },
  { id: '1CO', name: '1 Corintios', chapters: 16, testament: 'new' },
  { id: '2CO', name: '2 Corintios', chapters: 13, testament: 'new' },
  { id: 'GAL', name: 'Galatas', chapters: 6, testament: 'new' },
  { id: 'EPH', name: 'Efesios', chapters: 6, testament: 'new' },
  { id: 'PHP', name: 'Filipenses', chapters: 4, testament: 'new' },
  { id: 'COL', name: 'Colossenses', chapters: 4, testament: 'new' },
  { id: '1TH', name: '1 Tessalonicenses', chapters: 5, testament: 'new' },
  { id: '2TH', name: '2 Tessalonicenses', chapters: 3, testament: 'new' },
  { id: '1TI', name: '1 Timoteo', chapters: 6, testament: 'new' },
  { id: '2TI', name: '2 Timoteo', chapters: 4, testament: 'new' },
  { id: 'TIT', name: 'Tito', chapters: 3, testament: 'new' },
  { id: 'PHM', name: 'Filemom', chapters: 1, testament: 'new' },
  { id: 'HEB', name: 'Hebreus', chapters: 13, testament: 'new' },
  { id: 'JAS', name: 'Tiago', chapters: 5, testament: 'new' },
  { id: '1PE', name: '1 Pedro', chapters: 5, testament: 'new' },
  { id: '2PE', name: '2 Pedro', chapters: 3, testament: 'new' },
  { id: '1JN', name: '1 Joao', chapters: 5, testament: 'new' },
  { id: '2JN', name: '2 Joao', chapters: 1, testament: 'new' },
  { id: '3JN', name: '3 Joao', chapters: 1, testament: 'new' },
  { id: 'JUD', name: 'Judas', chapters: 1, testament: 'new' },
  { id: 'REV', name: 'Apocalipse', chapters: 22, testament: 'new' },
] as const

export type BibleBook = (typeof BIBLE_BOOKS_DATA)[number]

interface BookSelectorProps {
  selectedBook: string
  onSelectBook: (bookId: string) => void
  className?: string
}

export function BookSelector({ selectedBook, onSelectBook, className }: BookSelectorProps) {
  const [open, setOpen] = useState(false)

  const currentBook = BIBLE_BOOKS_DATA.find(b => b.id === selectedBook) || BIBLE_BOOKS_DATA[0]
  const oldTestament = BIBLE_BOOKS_DATA.filter(b => b.testament === 'old')
  const newTestament = BIBLE_BOOKS_DATA.filter(b => b.testament === 'new')

  const handleSelect = (bookId: string) => {
    onSelectBook(bookId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-between min-w-[200px]', className)}
        >
          <span className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            {currentBook.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Livro</DialogTitle>
        </DialogHeader>
        <div className="h-[400px] overflow-y-auto pr-4">
          <div className="space-y-4">
            {/* Old Testament */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Antigo Testamento
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {oldTestament.map(book => (
                  <button
                    key={book.id}
                    onClick={() => handleSelect(book.id)}
                    className={cn(
                      'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      'hover:bg-accent',
                      selectedBook === book.id && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>

            {/* New Testament */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Novo Testamento
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {newTestament.map(book => (
                  <button
                    key={book.id}
                    onClick={() => handleSelect(book.id)}
                    className={cn(
                      'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      'hover:bg-accent',
                      selectedBook === book.id && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function getBookChapters(bookId: string): number {
  const book = BIBLE_BOOKS_DATA.find(b => b.id === bookId)
  return book?.chapters || 1
}

export function getBookName(bookId: string): string {
  const book = BIBLE_BOOKS_DATA.find(b => b.id === bookId)
  return book?.name || bookId
}
