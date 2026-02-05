'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Check, Star, BookOpen, Heart, Users, MessageCircle, 
  HandHeart, Brain, Loader2
} from 'lucide-react'
import { 
  getDiscipleActivities, 
  getChildActivities,
  recordChildActivity,
  type DiscipleActivity,
  type ChildActivity
} from '@/actions/kids-gamification'

interface DiscipleChecklistProps {
  childId: string
  date?: string
  canEdit?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'hands-praying': HandHeart,
  'book-open': BookOpen,
  'message-circle': MessageCircle,
  'heart-handshake': Heart,
  'user-plus': Users,
  'brain': Brain,
  'check': Check,
}

export function DiscipleChecklist({ childId, date, canEdit = true }: DiscipleChecklistProps) {
  const [activities, setActivities] = useState<DiscipleActivity[]>([])
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  const today = date || new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [activitiesData, childActivitiesData] = await Promise.all([
        getDiscipleActivities(),
        getChildActivities(childId, today),
      ])
      setActivities(activitiesData)
      
      const completedIds = new Set(childActivitiesData.map(ca => ca.activity_id))
      setCompletedToday(completedIds)
      setLoading(false)
    }
    loadData()
  }, [childId, today])

  async function handleToggleActivity(activityId: string) {
    if (!canEdit || completedToday.has(activityId)) return

    setSaving(activityId)
    const result = await recordChildActivity(childId, activityId)
    setSaving(null)

    if (result.success) {
      setCompletedToday(prev => new Set([...prev, activityId]))
      const activity = activities.find(a => a.id === activityId)
      toast({
        title: 'Atividade registrada!',
        description: `+${activity?.points || 0} pontos`,
      })
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedCount = completedToday.size
  const totalCount = activities.filter(a => a.is_daily).length
  const totalPointsToday = activities
    .filter(a => completedToday.has(a.id))
    .reduce((sum, a) => sum + a.points, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Checklist do Discípulo
            </CardTitle>
            <CardDescription>
              {new Date(today).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-xl font-bold">{totalPointsToday}</span>
            </div>
            <p className="text-xs text-muted-foreground">pontos hoje</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{completedCount} de {totalCount} atividades</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {activities.map((activity) => {
            const isCompleted = completedToday.has(activity.id)
            const isSaving = saving === activity.id
            const IconComponent = iconMap[activity.icon_name] || Check

            return (
              <div
                key={activity.id}
                className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div
                  className="p-2 rounded-full"
                  style={{ 
                    backgroundColor: isCompleted 
                      ? `${activity.color}30` 
                      : `${activity.color}15`,
                    color: activity.color,
                  }}
                >
                  <IconComponent 
                    className="h-5 w-5 text-current"
                  />
                </div>

                <div className="flex-1">
                  <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {activity.name}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="mr-2">
                  +{activity.points} pts
                </Badge>

                {canEdit && (
                  <Button
                    variant={isCompleted ? 'secondary' : 'outline'}
                    size="sm"
                    disabled={isCompleted || isSaving}
                    onClick={() => handleToggleActivity(activity.id)}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      'Marcar'
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Celebration */}
        {completedCount === totalCount && totalCount > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg text-center">
            <p className="text-lg font-bold text-yellow-800">
              🎉 Parabéns! Todas as atividades concluídas!
            </p>
            <p className="text-sm text-yellow-700">
              Continue assim, você está crescendo na fé!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
