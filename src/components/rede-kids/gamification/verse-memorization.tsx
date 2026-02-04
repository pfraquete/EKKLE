'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  BookOpen, Star, Check, Search, Loader2, 
  ChevronRight, Award
} from 'lucide-react'
import { 
  getMemoryVerses, 
  getChildMemorizedVerses,
  markVerseAsMemorized,
  type MemoryVerse,
  type ChildMemorizedVerse
} from '@/actions/kids-gamification'

interface VerseMemorizationProps {
  childId: string
  canEdit?: boolean
}

export function VerseMemorization({ childId, canEdit = true }: VerseMemorizationProps) {
  const [verses, setVerses] = useState<MemoryVerse[]>([])
  const [memorized, setMemorized] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVerse, setSelectedVerse] = useState<MemoryVerse | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [versesData, memorizedData] = await Promise.all([
        getMemoryVerses(),
        getChildMemorizedVerses(childId),
      ])
      setVerses(versesData)
      setMemorized(new Set(memorizedData.map(m => m.verse_id)))
      setLoading(false)
    }
    loadData()
  }, [childId])

  async function handleMarkAsMemorized() {
    if (!selectedVerse) return

    setSaving(true)
    const result = await markVerseAsMemorized(childId, selectedVerse.id, notes)
    setSaving(false)

    if (result.success) {
      setMemorized(prev => new Set([...prev, selectedVerse.id]))
      setSelectedVerse(null)
      setNotes('')
      toast({
        title: 'Versículo memorizado!',
        description: `+${selectedVerse.points} pontos`,
      })
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const filteredVerses = verses.filter(v => 
    v.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingVerses = filteredVerses.filter(v => !memorized.has(v.id))
  const completedVerses = filteredVerses.filter(v => memorized.has(v.id))

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

  const totalPoints = verses.reduce((sum, v) => sum + v.points, 0)
  const earnedPoints = verses
    .filter(v => memorized.has(v.id))
    .reduce((sum, v) => sum + v.points, 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Versículos para Memorizar
              </CardTitle>
              <CardDescription>
                {memorized.size} de {verses.length} versículos memorizados
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-xl font-bold">{earnedPoints}</span>
                <span className="text-sm text-muted-foreground">/ {totalPoints}</span>
              </div>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar versículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Pending Verses */}
          {pendingVerses.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                Para Memorizar ({pendingVerses.length})
              </h4>
              <div className="space-y-3">
                {pendingVerses.map((verse) => (
                  <div
                    key={verse.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{verse.reference}</Badge>
                          <Badge 
                            variant="secondary"
                            className={
                              verse.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              verse.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }
                          >
                            {verse.difficulty === 'easy' ? 'Fácil' :
                             verse.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                          </Badge>
                          {verse.category && (
                            <Badge variant="outline" className="text-xs">
                              {verse.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "{verse.text}"
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4" />
                          <span className="font-bold">{verse.points}</span>
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedVerse(verse)}
                          >
                            <Award className="h-4 w-4 mr-1" />
                            Memorizei!
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Verses */}
          {completedVerses.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                Memorizados ({completedVerses.length})
              </h4>
              <div className="space-y-2">
                {completedVerses.map((verse) => (
                  <div
                    key={verse.id}
                    className="p-3 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{verse.reference}</span>
                        <Badge variant="secondary" className="text-xs">
                          +{verse.points} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredVerses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum versículo encontrado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para confirmar memorização */}
      <Dialog open={!!selectedVerse} onOpenChange={() => setSelectedVerse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Memorização</DialogTitle>
            <DialogDescription>
              Confirme que a criança memorizou este versículo
            </DialogDescription>
          </DialogHeader>

          {selectedVerse && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedVerse.reference}</Badge>
                  <Badge 
                    variant="secondary"
                    className={
                      selectedVerse.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      selectedVerse.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }
                  >
                    +{selectedVerse.points} pontos
                  </Badge>
                </div>
                <p className="text-sm italic">"{selectedVerse.text}"</p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Observações (opcional)
                </label>
                <Textarea
                  placeholder="Como foi a memorização? Alguma observação?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVerse(null)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkAsMemorized} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
