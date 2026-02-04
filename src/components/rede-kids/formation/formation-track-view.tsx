'use client'

import { FormationStage, ChildFormationProgress } from '@/actions/kids-formation'
import { cn } from '@/lib/utils'
import {
  Heart,
  Sparkles,
  BookOpen,
  GraduationCap,
  Crown,
  Star,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  sparkles: Sparkles,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  crown: Crown,
  star: Star,
}

interface FormationTrackViewProps {
  stages: FormationStage[]
  completedProgress: ChildFormationProgress[]
  currentStageId?: string | null
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  interactive?: boolean
  onStageClick?: (stage: FormationStage) => void
}

export function FormationTrackView({
  stages,
  completedProgress,
  currentStageId,
  size = 'md',
  showLabels = true,
  interactive = false,
  onStageClick,
}: FormationTrackViewProps) {
  const completedStageIds = completedProgress.map((p) => p.stage_id)

  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      circle: 'h-10 w-10',
      line: 'h-0.5',
      text: 'text-xs',
    },
    md: {
      icon: 'h-8 w-8',
      circle: 'h-14 w-14',
      line: 'h-1',
      text: 'text-sm',
    },
    lg: {
      icon: 'h-10 w-10',
      circle: 'h-18 w-18',
      line: 'h-1.5',
      text: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center justify-center w-full overflow-x-auto py-4">
      <div className="flex items-center gap-2">
        {stages.map((stage, index) => {
          const isCompleted = completedStageIds.includes(stage.id)
          const isCurrent = stage.id === currentStageId
          const isNext =
            !isCompleted &&
            !isCurrent &&
            index === completedStageIds.length
          const progress = completedProgress.find(
            (p) => p.stage_id === stage.id
          )

          const IconComponent = iconMap[stage.icon_name] || Star

          return (
            <div key={stage.id} className="flex items-center">
              {/* Stage Circle */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onStageClick?.(stage)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 transition-all duration-300',
                      interactive && 'cursor-pointer hover:scale-110',
                      !interactive && 'cursor-default'
                    )}
                  >
                    {/* Circle with Icon */}
                    <div
                      className={cn(
                        classes.circle,
                        'rounded-full flex items-center justify-center transition-all duration-300 relative',
                        isCompleted && 'ring-4 ring-offset-2',
                        isCurrent && 'ring-4 ring-offset-2 animate-pulse',
                        !isCompleted && !isCurrent && 'opacity-40'
                      )}
                      style={{
                        backgroundColor: isCompleted || isCurrent ? stage.color : '#e5e7eb',
                        ringColor: stage.color,
                      }}
                    >
                      <IconComponent
                        className={cn(
                          classes.icon,
                          isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                        )}
                      />

                      {/* Completed Check Badge */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Next Stage Indicator */}
                      {isNext && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 animate-bounce">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Stage Label */}
                    {showLabels && (
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            classes.text,
                            'font-medium text-center max-w-20 truncate',
                            isCompleted || isCurrent
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          )}
                        >
                          {stage.name}
                        </span>
                        {isCompleted && progress && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {format(new Date(progress.completed_at), 'dd/MM/yy', {
                              locale: ptBR,
                            })}
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{stage.name}</p>
                    {stage.description && (
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    )}
                    {isCompleted && progress && (
                      <div className="space-y-0.5 pt-1 border-t border-green-200 mt-1">
                        <p className="text-xs text-green-600">
                          ✅ Concluído em{' '}
                          {format(new Date(progress.completed_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                        {progress.completed_by_profile && (
                          <p className="text-xs text-gray-500">
                            👤 Por: {progress.completed_by_profile.full_name}
                          </p>
                        )}
                        {progress.notes && (
                          <p className="text-xs text-gray-500 italic">
                            📝 &quot;{progress.notes}&quot;
                          </p>
                        )}
                      </div>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-blue-600">Etapa atual</p>
                    )}
                    {isNext && (
                      <p className="text-xs text-orange-600">Próxima etapa</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Connecting Line */}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'w-8 mx-1 rounded-full transition-all duration-300',
                    classes.line,
                    completedStageIds.includes(stages[index + 1]?.id)
                      ? 'bg-green-500'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-gray-300'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
