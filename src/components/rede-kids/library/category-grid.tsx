'use client'

import { LibraryCategory } from '@/actions/kids-library'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Book,
  Music,
  Puzzle,
  Video,
  Folder,
  FileText,
  Image,
} from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  book: Book,
  music: Music,
  puzzle: Puzzle,
  video: Video,
  folder: Folder,
  'file-text': FileText,
  image: Image,
}

interface CategoryGridProps {
  categories: LibraryCategory[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const Icon = iconMap[category.icon_name] || Folder

        return (
          <Link key={category.id} href={`/rede-kids/biblioteca?categoria=${category.id}`}>
            <Card className="hover:shadow-md transition-all hover:scale-105 cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div
                  className="p-3 rounded-xl mb-3"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  <Icon
                    className="h-8 w-8 text-current"
                  />
                </div>
                <h3 className="font-medium text-sm">{category.name}</h3>
                {category.content_count !== undefined && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {category.content_count} {category.content_count === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
