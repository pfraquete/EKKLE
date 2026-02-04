'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Award, Loader2, Check, Star, BookOpen, Calendar, 
  Target, Trophy, Gift
} from 'lucide-react'
import { 
  getBadges, 
  getChildBadges,
  awardBadge,
  type Badge,
  type ChildBadge
} from '@/actions/kids-gamification'

interface AwardBadgeDialogProps {
  childId: string
  childName: string
  onBadgeAwarded?: () => void
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  verses: BookOpen,
  attendance: Calendar,
  activities: Target,
  formation: Trophy,
  special: Gift,
}

const categoryLabels: Record<string, string> = {
  verses: 'Versículos',
  attendance: 'Presença',
  activities: 'Atividades',
  formation: 'Formação',
  special: 'Especial',
}

export function AwardBadgeDialog({ childId, childName, onBadgeAwarded }: AwardBadgeDialogProps) {
  const [open, setOpen] = useState(false)
  const [badges, setBadges] = useState<Badge[]>([])
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set())
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, childId])

  async function loadData() {
    setLoading(true)
    const [badgesData, childBadgesData] = await Promise.all([
      getBadges(),
      getChildBadges(childId),
    ])
    setBadges(badgesData)
    setEarnedBadges(new Set(childBadgesData.map(cb => cb.badge_id)))
    setLoading(false)
  }

  async function handleAwardBadge() {
    if (!selectedBadge) return

    setSaving(true)
    const result = await awardBadge(childId, selectedBadge.id, notes)
    setSaving(false)

    if (result.success) {
      setEarnedBadges(prev => new Set([...prev, selectedBadge.id]))
      setSelectedBadge(null)
      setNotes('')
      setOpen(false)
      toast({
        title: 'Medalha concedida!',
        description: `${childName} ganhou a medalha "${selectedBadge.name}"`,
      })
      onBadgeAwarded?.()
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const availableBadges = badges.filter(b => !earnedBadges.has(b.id))
  const groupedBadges = availableBadges.reduce((acc, badge) => {
    const category = badge.category || 'special'
    if (!acc[category]) acc[category] = []
    acc[category].push(badge)
    return acc
  }, {} as Record<string, Badge[]>)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Award className="h-4 w-4 mr-2" />
          Conceder Medalha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conceder Medalha</DialogTitle>
          <DialogDescription>
            Selecione uma medalha para conceder a {childName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : selectedBadge ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: `${selectedBadge.color}20` }}
                >
                  <Award
                    className="h-8 w-8"
                    style={{ color: selectedBadge.color }}
                  />
                </div>
                <div>
                  <h4 className="font-bold">{selectedBadge.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-yellow-600">
                    <Star className="h-4 w-4" />
                    <span className="font-medium">+{selectedBadge.points_value} pontos</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Observações (opcional)
              </label>
              <Textarea
                placeholder="Por que esta medalha está sendo concedida?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBadge(null)}>
                Voltar
              </Button>
              <Button onClick={handleAwardBadge} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Conceder Medalha
              </Button>
            </DialogFooter>
          </div>
        ) : availableBadges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-lg font-medium">Todas as medalhas conquistadas!</p>
            <p className="text-muted-foreground">
              {childName} já possui todas as medalhas disponíveis.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBadges).map(([category, categoryBadges]) => {
              const IconComponent = categoryIcons[category] || Gift
              return (
                <div key={category}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryBadges.map((badge) => (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div
                          className="p-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${badge.color}20` }}
                        >
                          <Award
                            className="h-5 w-5"
                            style={{ color: badge.color }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{badge.name}</p>
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star className="h-3 w-3" />
                            <span>+{badge.points_value}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
