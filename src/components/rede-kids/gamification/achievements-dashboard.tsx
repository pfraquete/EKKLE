'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, Star, BookOpen, Medal, Target, Flame, 
  TrendingUp, Award, Sparkles, Crown
} from 'lucide-react'
import { 
  getChildGamificationStats, 
  getChildMemorizedVerses,
  getChildBadges,
  getChildPointsLog,
  type GamificationStats,
  type ChildMemorizedVerse,
  type ChildBadge,
  type PointsLog
} from '@/actions/kids-gamification'

interface AchievementsDashboardProps {
  childId: string
  childName: string
}

export function AchievementsDashboard({ childId, childName }: AchievementsDashboardProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [verses, setVerses] = useState<ChildMemorizedVerse[]>([])
  const [badges, setBadges] = useState<ChildBadge[]>([])
  const [pointsLog, setPointsLog] = useState<PointsLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [statsData, versesData, badgesData, pointsData] = await Promise.all([
        getChildGamificationStats(childId),
        getChildMemorizedVerses(childId),
        getChildBadges(childId),
        getChildPointsLog(childId),
      ])
      setStats(statsData)
      setVerses(versesData)
      setBadges(badgesData)
      setPointsLog(pointsData)
      setLoading(false)
    }
    loadData()
  }, [childId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Não foi possível carregar as conquistas
          </p>
        </CardContent>
      </Card>
    )
  }

  const levelProgress = stats.nextLevel 
    ? ((stats.totalPoints - (stats.currentLevel?.min_points || 0)) / 
       (stats.nextLevel.min_points - (stats.currentLevel?.min_points || 0))) * 100
    : 100

  return (
    <div className="space-y-6">
      {/* Header com Nível e Pontos */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{childName}</h3>
                <p className="text-white/80">
                  {stats.currentLevel?.name || 'Iniciante'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{stats.totalPoints}</div>
              <div className="text-white/80">pontos</div>
            </div>
          </div>

          {/* Barra de progresso para próximo nível */}
          {stats.nextLevel && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>{stats.currentLevel?.name}</span>
                <span>{stats.nextLevel.name}</span>
              </div>
              <Progress value={levelProgress} className="h-3 bg-white/20" />
              <p className="text-center text-sm mt-2 text-white/80">
                Faltam {stats.pointsToNextLevel} pontos para o próximo nível
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVerses}</p>
                <p className="text-sm text-muted-foreground">Versículos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Medal className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBadges}</p>
                <p className="text-sm text-muted-foreground">Medalhas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
                <p className="text-sm text-muted-foreground">Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Medalhas</TabsTrigger>
          <TabsTrigger value="verses">Versículos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Medalhas Conquistadas
              </CardTitle>
              <CardDescription>
                {badges.length} medalha{badges.length !== 1 ? 's' : ''} conquistada{badges.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma medalha conquistada ainda. Continue se esforçando!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {badges.map((childBadge) => (
                    <div
                      key={childBadge.id}
                      className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="p-3 rounded-full mb-2"
                        style={{ backgroundColor: `${childBadge.badge?.color}20` }}
                      >
                        <Award
                          className="h-8 w-8"
                          style={{ color: childBadge.badge?.color }}
                        />
                      </div>
                      <p className="font-medium text-center">{childBadge.badge?.name}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {new Date(childBadge.earned_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Versículos Memorizados
              </CardTitle>
              <CardDescription>
                {verses.length} versículo{verses.length !== 1 ? 's' : ''} memorizado{verses.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum versículo memorizado ainda. Vamos começar?
                </p>
              ) : (
                <div className="space-y-4">
                  {verses.map((mv) => (
                    <div
                      key={mv.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{mv.verse?.reference}</Badge>
                            <Badge 
                              variant="secondary"
                              className={
                                mv.verse?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                mv.verse?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }
                            >
                              {mv.verse?.difficulty === 'easy' ? 'Fácil' :
                               mv.verse?.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            "{mv.verse?.text}"
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-bold">{mv.points_earned}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mv.memorized_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Histórico de Pontos
              </CardTitle>
              <CardDescription>
                Últimas atividades e conquistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pointsLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum ponto registrado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {pointsLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          log.source_type === 'verse' ? 'bg-blue-100' :
                          log.source_type === 'badge' ? 'bg-yellow-100' :
                          log.source_type === 'activity' ? 'bg-green-100' :
                          log.source_type === 'attendance' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {log.source_type === 'verse' ? <BookOpen className="h-4 w-4 text-blue-600" /> :
                           log.source_type === 'badge' ? <Medal className="h-4 w-4 text-yellow-600" /> :
                           log.source_type === 'activity' ? <Target className="h-4 w-4 text-green-600" /> :
                           log.source_type === 'attendance' ? <Sparkles className="h-4 w-4 text-purple-600" /> :
                           <Star className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{log.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${log.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.points >= 0 ? '+' : ''}{log.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
