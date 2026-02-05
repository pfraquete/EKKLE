'use client'

import { LibraryContent } from '@/actions/kids-library'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookOpen,
  Book,
  Music,
  Puzzle,
  Video,
  FileText,
  Image,
  File,
  MoreVertical,
  Eye,
  Star,
  StarOff,
  Trash2,
  Edit,
  Download,
  Clock,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  lesson: BookOpen,
  story: Book,
  music: Music,
  activity: Puzzle,
  video: Video,
  document: FileText,
  image: Image,
  other: File,
}

const contentTypeLabels: Record<string, string> = {
  lesson: 'Lição',
  story: 'História',
  music: 'Música',
  activity: 'Atividade',
  video: 'Vídeo',
  document: 'Documento',
  image: 'Imagem',
  other: 'Outro',
}

interface ContentCardProps {
  content: LibraryContent
  onEdit?: () => void
  onDelete?: () => void
  onToggleFeatured?: () => void
  showActions?: boolean
}

export function ContentCard({
  content,
  onEdit,
  onDelete,
  onToggleFeatured,
  showActions = true,
}: ContentCardProps) {
  const Icon = contentTypeIcons[content.content_type] || File

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: content.category?.color
                  ? `${content.category.color}20`
                  : '#f3f4f6',
                color: content.category?.color || '#6b7280',
              }}
            >
              <Icon
                className="h-5 w-5 text-current"
              />
            </div>
            <div>
              <Badge variant="outline" className="text-xs">
                {contentTypeLabels[content.content_type]}
              </Badge>
              {content.is_featured && (
                <Badge variant="default" className="ml-1 text-xs bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Destaque
                </Badge>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleFeatured}>
                  {content.is_featured ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Remover destaque
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Destacar
                    </>
                  )}
                </DropdownMenuItem>
                {content.file_url && (
                  <DropdownMenuItem asChild>
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <Link href={`/rede-kids/biblioteca/${content.id}`} className="block">
          <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
            {content.title}
          </h3>
        </Link>
        {content.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {content.description}
          </p>
        )}

        {content.bible_reference && (
          <p className="text-sm text-primary mt-2 font-medium">
            📖 {content.bible_reference}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mt-3">
          {content.tags?.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {content.tags && content.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{content.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 text-xs text-muted-foreground border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {content.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {content.duration_minutes} min
              </span>
            )}
            {(content.target_age_min || content.target_age_max) && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {content.target_age_min || 0}-{content.target_age_max || 12} anos
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {content.view_count}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
