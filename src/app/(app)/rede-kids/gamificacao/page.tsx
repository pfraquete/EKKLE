import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, BookOpen, Medal, Target, Settings, 
  Sparkles, Loader2
} from 'lucide-react'
import { KidsRanking } from '@/components/rede-kids/gamification'
import { getProfile } from '@/actions/auth'
import { getMemoryVerses, getBadges, getDiscipleActivities, getLevels } from '@/actions/kids-gamification'
import Link from 'next/link'

export const metadata = {
  title: 'Gamificação Kids | EKKLE',
  description: 'Sistema de pontos, medalhas e conquistas para crianças',
}

async function GamificationStats() {
  const [verses, badges, activities, levels] = await Promise.all([
    getMemoryVerses(),
    getBadges(),
    getDiscipleActivities(),
    getLevels(),
  ])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{verses.length}</p>
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
              <p className="text-2xl font-bold">{badges.length}</p>
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
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-sm text-muted-foreground">Atividades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levels.length}</p>
              <p className="text-sm text-muted-foreground">Níveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function VersesTable() {
  const verses = await getMemoryVerses()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Versículos para Memorização
        </CardTitle>
        <CardDescription>
          Lista de versículos disponíveis para as crianças memorizarem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum versículo cadastrado.</p>
            <p className="text-sm text-muted-foreground">
              Acesse as configurações para criar versículos padrão.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {verses.slice(0, 5).map((verse) => (
              <div key={verse.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{verse.reference}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      verse.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      verse.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {verse.difficulty === 'easy' ? 'Fácil' :
                       verse.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                    <span className="text-sm text-yellow-600 font-medium">
                      +{verse.points} pts
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{verse.text}"
                </p>
              </div>
            ))}
            {verses.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">
                E mais {verses.length - 5} versículos...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function BadgesGrid() {
  const badges = await getBadges()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Medalhas Disponíveis
        </CardTitle>
        <CardDescription>
          Medalhas que as crianças podem conquistar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma medalha cadastrada.</p>
            <p className="text-sm text-muted-foreground">
              Acesse as configurações para criar medalhas padrão.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 border rounded-lg"
              >
                <div
                  className="p-3 rounded-full mb-2"
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  <Medal
                    className="h-6 w-6"
                    style={{ color: badge.color }}
                  />
                </div>
                <p className="font-medium text-center text-sm">{badge.name}</p>
                <p className="text-xs text-yellow-600">+{badge.points_value} pts</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function GamificacaoPage() {
  const profile = await getProfile()
  const isPastor = profile?.role === 'PASTOR'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Gamificação Kids
          </h1>
          <p className="text-muted-foreground">
            Sistema de pontos, medalhas e conquistas para crianças
          </p>
        </div>
        {isPastor && (
          <Link href="/rede-kids/configuracoes/gamificacao">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <Suspense fallback={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <GamificationStats />
      </Suspense>

      {/* Tabs */}
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="verses">Versículos</TabsTrigger>
          <TabsTrigger value="badges">Medalhas</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4">
          <Suspense fallback={
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          }>
            <KidsRanking limit={20} />
          </Suspense>
        </TabsContent>

        <TabsContent value="verses" className="mt-4">
          <Suspense fallback={
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          }>
            <VersesTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <Suspense fallback={
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          }>
            <BadgesGrid />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
